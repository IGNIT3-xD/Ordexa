import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";
import { SSLCommerzAdapter } from "./sslcommerz.adapter.js";
import { PlanType, PaymentStatus, SubscriptionStatus } from "../../../generated/prisma/enums.js";

export class BillingService {
    // 1. Initialize a Subscription for a new business
    static async initSubscription(businessId: string) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month of free usage

        return prisma.subscription.create({
            data: {
                businessId,
                plan: PlanType.FREE,
                currentPeriodEnd: periodEnd,
            },
        });
    }

    // 2. Checkout for Monthly/Yearly
    static async createCheckout(businessId: string, plan: PlanType, customerDetails: any) {
        const subscription = await prisma.subscription.findUnique({ where: { businessId } });

        if (!subscription)
            throw new ApiError(404, "Subscription not found");

        const isExpired = subscription.currentPeriodEnd < new Date();
        const currentActivePlan = isExpired ? PlanType.FREE : subscription.plan;

        if (currentActivePlan === plan) {
            throw new ApiError(400, `You are already subscribed to the ${plan} plan.`);
        }

        if (currentActivePlan === PlanType.YEARLY && plan === PlanType.MONTHLY) {
            throw new ApiError(400, "You cannot downgrade to Monthly while your Yearly plan is active.");
        }

        const amount = plan === PlanType.MONTHLY ? 599 : 5999;
        const tranId = `TXN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

        // Create a pending payment record
        await prisma.billingPayment.create({
            data: {
                subscriptionId: subscription.id,
                amount,
                tranId,
                plan,
            },
        });

        const gatewayUrl = await SSLCommerzAdapter.initiatePayment({
            tranId,
            amount,
            customerName: customerDetails.name,
            customerEmail: customerDetails.email,
            customerPhone: customerDetails.phone,
            customerAddress: "N/A",
            productName: `Ordexa ${plan} Plan`,
        });

        return { gatewayUrl };
    }

    // 3. Handle SSLCommerz Success Callback (IPN)
    static async handlePaymentSuccess(valId: string, tranId: string) {
        const validation = await SSLCommerzAdapter.validatePayment(valId);

        if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
            throw new ApiError(400, "Invalid payment validation");
        }

        const payment = await prisma.billingPayment.findUnique({
            where: { tranId },
            include: { subscription: true },
        });

        if (!payment || payment.status === PaymentStatus.SUCCESS) {
            return { message: "Payment already processed or not found" };
        }

        const subscription = payment.subscription;

        // 🚨 CALCULATE NEW END DATE (Stacking Time)
        // If upgrading from Monthly to Yearly, we start the 1 year from the CURRENT end date, not today.
        // If expired or FREE, we start from today.
        const isExpired = subscription.currentPeriodEnd < new Date();
        const baseDate = isExpired ? new Date() : subscription.currentPeriodEnd;

        const newPeriodEnd = new Date(baseDate);

        if (payment.plan === PlanType.MONTHLY) {
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

        } else if (payment.plan === PlanType.YEARLY) {
            newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
        }

        await prisma.$transaction([
            prisma.billingPayment.update({
                where: { id: payment.id },
                data: { status: PaymentStatus.SUCCESS },
            }),
            prisma.subscription.update({
                where: { id: payment.subscriptionId },
                data: {
                    plan: payment.plan,
                    status: SubscriptionStatus.ACTIVE,
                    // If it's an upgrade, keep the start date. If expired, reset start date to now.
                    currentPeriodStart: isExpired ? new Date() : subscription.currentPeriodStart,
                    currentPeriodEnd: newPeriodEnd,
                },
            }),
        ]);

        return { message: "Payment successful, plan upgraded" };
    }

    // 4. Check quota
    static async checkQuota(businessId: string) {
        const subscription = await prisma.subscription.findUnique({ where: { businessId } });

        if (!subscription)
            return false;

        // If expired, fallback to Free limits
        const isExpired = subscription.currentPeriodEnd < new Date();
        const activePlan = isExpired ? PlanType.FREE : subscription.plan;

        let maxOrders = 5;
        if (activePlan === PlanType.MONTHLY)
            maxOrders = 1000;

        if (activePlan === PlanType.YEARLY)
            maxOrders = Infinity;

        // Count confirmed orders in the current period
        const orderCount = await prisma.order.count({
            where: {
                businessId,
                status: "CONFIRM",
                createdAt: { gte: subscription.currentPeriodStart },
            },
        });

        return orderCount < maxOrders;
    }

    static async getSubscription(businessId: string) {
        const subscription = await prisma.subscription.findUnique({
            where: { businessId },
        });

        if (!subscription) {
            throw new ApiError(404, "Subscription not found");
        }

        // 1. Check if the subscription has expired
        const isExpired = subscription.currentPeriodEnd < new Date();
        const effectivePlan = isExpired ? PlanType.FREE : subscription.plan;

        // 2. Determine the max order limit based on the effective plan
        let maxOrders = 5;

        if (effectivePlan === PlanType.MONTHLY)
            maxOrders = 1000;

        if (effectivePlan === PlanType.YEARLY)
            maxOrders = Infinity;

        // 3. Calculate how many orders have been confirmed in this period
        // Note: If the subscription is expired, we are counting from the start of the *new* month,
        // but for simplicity, we count from the last period start or the beginning of the current month.

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const queryStartDate = isExpired ? startOfMonth : subscription.currentPeriodStart;

        const ordersUsed = await prisma.order.count({
            where: {
                businessId,
                status: "CONFIRM",
                createdAt: { gte: queryStartDate },
            },
        });

        const canUpgradeTo = [];

        if (effectivePlan === PlanType.FREE) {
            canUpgradeTo.push(PlanType.MONTHLY, PlanType.YEARLY);
        } else if (effectivePlan === PlanType.MONTHLY) {
            canUpgradeTo.push(PlanType.YEARLY);
        }

        // 4. Return the hydrated object
        return {
            plan: effectivePlan,
            status: isExpired ? SubscriptionStatus.EXPIRED : subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            usage: {
                ordersUsed,
                maxOrders: maxOrders === Infinity ? "Unlimited" : maxOrders,
                isLimitReached: maxOrders !== Infinity && ordersUsed >= maxOrders,
            },
            canUpgradeTo
        };
    }
}