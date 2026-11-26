import { currency, InvitationStatus, PlanType, Role, SubscriptionStatus } from "../../../generated/prisma/enums.js";
import { sendInviteEmail } from "../../lib/mailer.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";
import { addMonths } from "../../utils/date.js";
import crypto from "node:crypto";

export class BusinessService {
    static async createBusiness(userId: string, data: { name: string; slug: string }) {
        const existingSlug = await prisma.business.findUnique({
            where: { slug: data.slug },
        });

        if (existingSlug) {
            throw new ApiError(409, "This slug is already taken");
        }

        // Create business, membership, AND subscription in a single transaction
        const business = await prisma.$transaction(async (tx) => {
            const newBusiness = await tx.business.create({
                data: { name: data.name, slug: data.slug },
            });

            await tx.membership.create({
                data: {
                    userId,
                    businessId: newBusiness.id,
                    role: "OWNER",
                },
            });

            // Automatically create the FREE subscription
            const periodEnd = addMonths(new Date(), 1);

            await tx.subscription.create({
                data: {
                    businessId: newBusiness.id,
                    plan: PlanType.FREE,
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodEnd: periodEnd,
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

        return memberships.map((m: any) => ({
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

    static async updateBusiness(
        businessId: string,
        data: { name?: string; currency?: currency; timezone?: string }
    ) {
        return prisma.business.update({
            where: { id: businessId },
            data: {
                name: data.name,
                currency: data.currency,
                timezone: data.timezone,
            },
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

    static async inviteUser(businessId: string, email: string, role: "MANAGER" | "STAFF") {
        const business = await prisma.business.findUnique({ where: { id: businessId } });

        if (!business)
            throw new ApiError(404, "Business not found");

        const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { memberships: true }
        });

        if (existingUser) {
            const isMember = existingUser.memberships.some(m => m.businessId === businessId);

            if (isMember)
                throw new ApiError(409, "User is already a member of this business");
        }

        // Generate token
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        // Save invite
        await prisma.invitation.create({
            data: {
                email, role, businessId, token: tokenHash,
                expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
            },
        });

        await sendInviteEmail(email, business.name, role, rawToken);

        return { message: "Invitation sent successfully" };
    }

    static async acceptInvite(userId: string, rawToken: string) {
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        const invite = await prisma.invitation.findUnique({
            where: { token: tokenHash }
        });

        if (!invite || invite.status !== InvitationStatus.PENDING || invite.expiresAt < new Date()) {
            throw new ApiError(400, "Invalid or expired invitation");
        }

        // Verify the logged-in user's email matches the invite
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (user?.email !== invite.email) {
            throw new ApiError(403, "This invitation was sent to a different email address");
        }

        // Add them to the business and mark invite as accepted
        await prisma.$transaction([
            prisma.membership.create({
                data: { userId, businessId: invite.businessId, role: invite.role },
            }),

            prisma.invitation.update({
                where: { id: invite.id }, data: { status: InvitationStatus.ACCEPTED },
            }),
        ]);

        return { message: "Invitation accepted successfully" };
    }

    static async updateMemberRole(businessId: string, memberId: string, newRole: "MANAGER" | "STAFF") {
        const membership = await prisma.membership.findUnique({
            where: { id: memberId },
        });

        if (!membership || membership.businessId !== businessId) {
            throw new ApiError(404, "Member not found in this business");
        }

        if (membership.role === Role.OWNER) {
            throw new ApiError(403, "Cannot change the role of the business owner");
        }

        return prisma.membership.update({
            where: { id: memberId },
            data: { role: newRole },
        });
    }

    static async removeMember(businessId: string, memberId: string) {
        const membership = await prisma.membership.findUnique({
            where: { id: memberId },
        });

        if (!membership || membership.businessId !== businessId) {
            throw new ApiError(404, "Member not found in this business");
        }

        if (membership.role === Role.OWNER) {
            throw new ApiError(403, "Cannot remove the business owner");
        }

        await prisma.membership.delete({
            where: { id: memberId },
        });

        return { message: "Member removed successfully" };
    }
}