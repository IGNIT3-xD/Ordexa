import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/AppError.js";
import { AnalyticsService } from "./analytics.service.js";

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await AnalyticsService.getOverview(req.tenant.businessId);

    res.json(result);
});

export const getSalesChart = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await AnalyticsService.getSalesChart(req.tenant.businessId);

    res.json(result);
});

export const getTopProducts = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await AnalyticsService.getTopProducts(req.tenant.businessId);

    res.json(result);
});

export const getLowStock = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await AnalyticsService.getLowStock(req.tenant.businessId);

    res.json(result);
});