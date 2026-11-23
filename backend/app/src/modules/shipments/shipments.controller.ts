import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/AppError.js";
import { ShipmentService } from "./shipments.service.js";

export const bookShipment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await ShipmentService.bookShipment(req.tenant.businessId, req.params.orderId as string);

    res.status(202).json(result);
});

export const listShipments = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const { status, search, page, limit } = (req as any).validatedQuery;

    const result = await ShipmentService.listShipments(
        req.tenant.businessId,
        status,
        search,
        page,
        limit
    );

    res.json(result);
});

export const getShipment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await ShipmentService.getShipmentById(
        req.tenant.businessId,
        req.params.shipmentId as string
    );

    res.json(result);
});

export const retryShipment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await ShipmentService.retryShipment(
        req.tenant.businessId,
        req.params.shipmentId as string
    );

    res.status(202).json(result);
});