import { prisma } from "../../lib/prisma.js";
import { OrderStatus, OrderSubmissionStatus } from "../../../generated/prisma/enums.js";

export class AnalyticsService {
    // High-level overview numbers
    static async getOverview(businessId: string) {
        const [revenueData, ordersCount, pendingOrders, pendingSubmissions] = await Promise.all([
            // Sum of all confirmed orders
            prisma.order.aggregate({
                where: { businessId, status: OrderStatus.CONFIRM },
                _sum: { totalAmount: true },
            }),
            // Count of confirmed orders
            prisma.order.count({
                where: { businessId, status: OrderStatus.CONFIRM },
            }),
            // Count of orders waiting to be confirmed
            prisma.order.count({
                where: { businessId, status: OrderStatus.PENDING_CONFIRMATION },
            }),
            // Count of submissions waiting to be converted
            prisma.orderSubmission.count({
                where: { businessId, status: OrderSubmissionStatus.PENDING },
            }),
        ]);

        return {
            totalRevenue: revenueData._sum.totalAmount || 0,
            totalConfirmedOrders: ordersCount,
            pendingOrders,
            pendingSubmissions,
        };
    }

    // Sales Chart (Revenue for the last 30 days)
    static async getSalesChart(businessId: string) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const orders = await prisma.order.findMany({
            where: {
                businessId,
                status: OrderStatus.CONFIRM,
                createdAt: { gte: thirtyDaysAgo },
            },
            select: { createdAt: true, totalAmount: true },
            orderBy: { createdAt: "asc" },
        });

        // Group by date string (YYYY-MM-DD)
        const groupedData = orders.reduce((acc: any, order: any) => {
            const date = order.createdAt.toISOString().split("T")[0] as string;
            if (!acc[date]) acc[date] = 0;
            acc[date] += Number(order.totalAmount);
            return acc;
        }, {} as Record<string, number>);

        // Format for the frontend chart library (e.g., Recharts/Chart.js)
        return Object.entries(groupedData).map(([date, revenue]) => ({
            date,
            revenue,
        }));
    }

    // Top 5 Best-Selling Products
    static async getTopProducts(businessId: string) {
        // Group OrderItems by product name, sum their quantities, and get the top 5
        const topProducts = await prisma.orderItem.groupBy({
            by: ["productName"],
            where: {
                order: { businessId, status: OrderStatus.CONFIRM },
            },
            _sum: {
                quantity: true,
                lineTotal: true,
            },
            orderBy: {
                _sum: { quantity: "desc" },
            },
            take: 5,
        });

        return topProducts.map((item: any) => ({
            productName: item.productName,
            unitsSold: item._sum.quantity || 0,
            revenue: item._sum.lineTotal || 0,
        }));
    }

    // Low Stock Alerts (Stock < 5)
    static async getLowStock(businessId: string) {
        return prisma.productVariant.findMany({
            where: {
                businessId,
                isDeleted: false,
                stock: { lte: 5 },
            },
            include: {
                product: { select: { name: true } },
            },
            orderBy: { stock: "asc" },
            take: 10, // Limit to top 10 most critical
        });
    }
}