import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/AppError.js";
import { CourierService } from "./courier.service.js";

export const connectCourier = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await CourierService.connectCourier(req.tenant.businessId, req.body);

    res.json({ message: "Courier connected successfully", provider: result.provider });
});

export const getConnections = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await CourierService.getConnections(req.tenant.businessId);

    res.json(result);
});