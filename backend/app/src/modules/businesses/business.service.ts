import { currency, Role } from "../../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";

export class BusinessService {
    static async createBusiness(userId: string, data: { name: string; slug: string }) {
        const existingSlug = await prisma.business.findUnique({
            where: { slug: data.slug },
        });

        if (existingSlug) {
            throw new ApiError(409, "This slug is already taken");
        }

        // Create business AND membership in a single transaction
        const business = await prisma.$transaction(async (tx) => {
            const newBusiness = await tx.business.create({
                data: { name: data.name, slug: data.slug },
            });

            await tx.membership.create({
                data: {
                    userId,
                    businessId: newBusiness.id,
                    role: Role.OWNER,
                },
            });

            return newBusiness;
        });

        return business;
    }

    static async getUserBusinesses(userId: string) {
        // List all businesses the user belongs to
        const memberships = await prisma.membership.findMany({
            where: { userId },
            include: {
                business: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return memberships.map((m) => ({
            ...m.business,
            role: m.role,
        }));
    }

    static async getCurrentBusiness(businessId: string) {
        const business = await prisma.business.findUnique({
            where: { id: businessId },
        });

        if (!business) throw new ApiError(404, "Business not found");

        return business;
    }

    static async updateBusiness(businessId: string, data: { name?: string; currency?: currency; timezone?: string }) {
        return prisma.business.update({
            where: { id: businessId },
            data,
        });
    }

    static async getMembers(businessId: string) {
        return prisma.membership.findMany({
            where: { businessId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, profilePic: true },
                },
            },
            orderBy: { createdAt: "asc" },
        });
    }

    static async deleteBusiness(businessId: string) {
        return prisma.business.update({
            where: { id: businessId },
            data: { isDeleted: true, status: "SUSPENDED" },
        });
    }
}