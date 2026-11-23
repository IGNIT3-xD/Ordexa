import { type Request, type Response, type NextFunction } from "express";
import { BillingService } from "../modules/billing/billing.service.js";
import { ApiError } from "../utils/AppError.js";

export const enforceQuota = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant)
        return next(new ApiError(500, "Tenant missing"));

    const hasQuota = await BillingService.checkQuota(req.tenant.businessId);

    if (!hasQuota) {
        return next(
            new ApiError(403, "Order quota exceeded. Please upgrade your plan to confirm more orders.")
        );
    }

    next();
};