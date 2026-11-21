import { type Request, type Response } from "express";
import { ApiError } from "../../utils/AppError.js";
import { BusinessService } from "./business.service.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";

export const createBusiness = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { name, slug } = req.body;

    const business = await BusinessService.createBusiness(userId, { name, slug });
    res.status(201).json(business);
});

export const listMyBusinesses = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    const businesses = await BusinessService.getUserBusinesses(userId);
    res.json(businesses);
});

export const getCurrentBusiness = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant context missing");

    const business = await BusinessService.getCurrentBusiness(req.tenant.businessId);
    res.json({ ...business, role: req.tenant.role });
});

export const updateBusiness = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant context missing");

    const updated = await BusinessService.updateBusiness(req.tenant.businessId, req.body);
    res.json(updated);
});

export const getMembers = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant context missing");

    const members = await BusinessService.getMembers(req.tenant.businessId);
    res.json(members);
});

export const deleteBusiness = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant context missing");

    await BusinessService.deleteBusiness(req.tenant.businessId);

    res.json({ message: "Business deleted successfully" });
});