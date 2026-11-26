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

    const { name, currency, timezone } = req.body;

    const updated = await BusinessService.updateBusiness(
        req.tenant.businessId,
        { name, currency, timezone } // <-- Pass the safe object
    );

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

export const inviteUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant context missing");

    const { email, role } = req.body;

    const result = await BusinessService.inviteUser(req.tenant.businessId, email, role);

    res.status(201).json(result);
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { token } = req.body;

    const result = await BusinessService.acceptInvite(userId, token);

    res.json(result);
});


export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant context missing");

    const { memberId } = req.params;
    const { role } = req.body;

    const updated = await BusinessService.updateMemberRole(req.tenant.businessId, memberId as string, role);

    res.json(updated);
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant context missing");

    const { memberId } = req.params;

    const result = await BusinessService.removeMember(req.tenant.businessId, memberId as string);

    res.json(result);
});