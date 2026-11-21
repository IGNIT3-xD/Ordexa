import { type Request, type Response, type NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/AppError.js";

// Extend Request to include our tenant context
declare global {
    namespace Express {
        interface Request {
            tenant?: {
                businessId: string;
                role: string;
                membershipId: string;
            };
        }
    }
}

export const resolveBusiness = async (req: Request, _res: Response, next: NextFunction) => {
    // req.userId is guaranteed to exist because 'protect' ran first
    const userId = (req as any).userId;
    const businessId = req.headers["x-business-id"] as string;

    if (!businessId) {
        return next(new ApiError(400, "Missing x-business-id header"));
    }

    // Find the membership bridging this user and this business
    const membership = await prisma.membership.findUnique({
        where: {
            userId_businessId: {
                userId, businessId
            }
        },
        include: { business: true }
    });

    if (!membership || membership.business.isDeleted) {
        return next(new ApiError(403, "You do not have access to this business"));
    }

    // Attach the verified context to the request
    req.tenant = {
        businessId: membership.businessId,
        role: membership.role,
        membershipId: membership.id,
    };

    next();
};

// Helper for role-based access control (RBAC)
export const requireRole = (allowedRoles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.tenant) {
            return next(new ApiError(500, "Tenant context missing"));
        }

        if (!allowedRoles.includes(req.tenant.role)) {
            return next(new ApiError(403, "You do not have permission to perform this action"));
        }

        next();
    };
};