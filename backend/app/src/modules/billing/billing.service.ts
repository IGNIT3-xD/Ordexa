import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";
import { SSLCommerzAdapter } from "./sslcommerz.adapter.js";
import { PlanType, PaymentStatus, SubscriptionStatus } from "../../../generated/prisma/enums.js";
import { env } from "../../config/env.js";
import { addMonths, startOfMonth } from "../../utils/date.js";

export class BillingService {
    // 1. Initialize a Subscription for a new business
    static async initSubscription(businessId: string) {
        const periodEnd = addMonths(new Date(), 1); // 1 month of free usage

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
        if (plan !== PlanType.MONTHLY && plan !== PlanType.YEARLY) {
            throw new ApiError(400, "Invalid plan selected");
        }

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
        const tranId = `TXN-${crypto.randomBytes(16).toString("hex").toUpperCase()}`;

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
        // 1. Validate with SSLCommerz
        const validation = await SSLCommerzAdapter.validatePayment(valId);

        // 2. Strict Validation Checks
        if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
            throw new ApiError(400, "Invalid payment validation");
        }

        if (validation.tran_id !== tranId) {
            throw new ApiError(400, "Transaction ID mismatch");
        }

        if (validation.store_id !== env.SSLCOMMERZ_STORE_ID) {
            throw new ApiError(400, "Store ID mismatch");
        }

        if (validation.currency !== "BDT") {
            throw new ApiError(400, "Invalid currency");
        }

        // 3. Fetch the pending payment
        const payment = await prisma.billingPayment.findUnique({
            where: { tranId },
            include: { subscription: true },
        });

        if (!payment) {
            throw new ApiError(404, "Payment record not found");
        }

        if (payment.status === PaymentStatus.SUCCESS) {
            return { message: "Payment already processed" };
        }

        // 4. Verify the amount matches the plan!
        if (Number(validation.amount) !== Number(payment.amount)) {
            throw new ApiError(400, "Payment amount mismatch. Possible tampering.");
        }

        // 5. Calculate new subscription period
        const isExpired = payment.subscription.currentPeriodEnd < new Date();
        const baseDate = isExpired ? new Date() : payment.subscription.currentPeriodEnd;
        let newPeriodEnd = new Date(baseDate);

        if (payment.plan === PlanType.MONTHLY) {
            newPeriodEnd = addMonths(newPeriodEnd, 1);
        } else if (payment.plan === PlanType.YEARLY) {
            newPeriodEnd = addMonths(newPeriodEnd, 12);
        }

        // 6. Atomic Database Update (Prevents Race Conditions)
        await prisma.$transaction(async (tx) => {
            const updatedPayment = await tx.billingPayment.updateMany({
                where: {
                    id: payment.id,
                    status: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] }
                },
                data: {
                    status: PaymentStatus.SUCCESS,
                    valId: valId
                },
            });

            // If count is 0, another concurrent request beat us to it
            if (updatedPayment.count === 0) {
                throw new ApiError(400, "Payment already processed");
            }

            await tx.subscription.update({
                where: { id: payment.subscriptionId },
                data: {
                    plan: payment.plan,
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodStart: isExpired ? new Date() : payment.subscription.currentPeriodStart,
                    currentPeriodEnd: newPeriodEnd,
                },
            });
        });

        return { message: "Payment successful, plan upgraded" };
    }

    // 3b. Mark a pending payment as failed/cancelled (from fail/cancel callbacks)
    static async markPaymentFailed(tranId: string) {
        if (!tranId) {
            return { message: "No transaction id provided" };
        }

        await prisma.billingPayment.updateMany({
            where: { tranId, status: PaymentStatus.PENDING },
            data: { status: PaymentStatus.FAILED },
        });

        return { message: "Payment marked as failed" };
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

        // Count confirmed orders in the current period. Use the same window as
        // getSubscription so the two endpoints never disagree.
        const queryStartDate = isExpired
            ? startOfMonth()
            : subscription.currentPeriodStart;

        const orderCount = await prisma.order.count({
            where: {
                businessId,
                status: "CONFIRM",
                createdAt: { gte: queryStartDate },
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

        const queryStartDate = isExpired
            ? startOfMonth()
            : subscription.currentPeriodStart;

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