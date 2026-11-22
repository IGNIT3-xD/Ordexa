import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/AppError.js";
import { OrderService } from "./order.service.js";

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const { status, search, page, limit } = (req as any).validatedQuery;

    const result = await OrderService.listOrders(
        req.tenant.businessId,
        status,
        search,
        page,
        limit
    );

    res.json(result);
});


export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const userId = (req as any).userId;
    const { status } = req.body;

    const order = await OrderService.updateOrderStatus(
        req.tenant.businessId,
        req.params.orderId as string,
        status,
        userId
    );

    res.json(order);
});