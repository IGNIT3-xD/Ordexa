import { prisma } from "../../lib/prisma.js";
import { encrypt } from "../../lib/encryption.js";
import type { CourierProvider } from "../../../generated/prisma/enums.js";

export class CourierService {
    static async connectCourier(businessId: string, data: { provider: CourierProvider; apiKey: string; secretKey: string }) {
        const encryptedApiKey = encrypt(data.apiKey);
        const encryptedSecretKey = encrypt(data.secretKey);

        return prisma.courierConnection.upsert({
            where: {
                businessId_provider: { businessId, provider: data.provider },
            },
            update: {
                apiKey: encryptedApiKey,
                secretKey: encryptedSecretKey,
                isActive: true,
            },
            create: {
                businessId,
                provider: data.provider,
                apiKey: encryptedApiKey,
                secretKey: encryptedSecretKey,
            },
        });
    }

    static async getConnections(businessId: string) {
        return prisma.courierConnection.findMany({
            where: { businessId },
            select: { id: true, provider: true, isActive: true, createdAt: true },
        });
    }
}