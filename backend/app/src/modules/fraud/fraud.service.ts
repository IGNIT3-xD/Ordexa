import { prisma } from "../../lib/prisma.js";
import { FraudAdapter } from "./fraud.adapter.js";

export class FraudService {
    static async checkPhone(businessId: string, phone: string) {
        // Check cache (results are valid for 24 hours)
        const existingCheck = await prisma.fraudCheck.findUnique({
            where: { businessId_phone: { businessId, phone } },
        });

        if (existingCheck) {
            const hoursSinceCheck = (Date.now() - existingCheck.createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceCheck < 24) {
                return {
                    score: existingCheck.score,
                    status: existingCheck.status,
                    data: existingCheck.data,
                    cached: true
                };
            }
        }

        // Call API if not cached
        const result = await FraudAdapter.checkPhoneNumber(phone);

        // Save to cache
        await prisma.fraudCheck.upsert({
            where: { businessId_phone: { businessId, phone } },
            update: {
                score: result.score,
                status: result.status,
                data: result.data,
                createdAt: new Date(),
            },
            create: {
                businessId,
                phone,
                score: result.score,
                status: result.status,
                data: result.data,
            },
        });

        return { ...result, cached: false };
    }
}