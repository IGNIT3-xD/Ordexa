import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/AppError.js";
import { ProductService } from "./product.service.js";
import type { ProductStatus } from "../../../generated/prisma/enums.js";

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const files = req.files as Express.Multer.File[] | undefined;

    const product = await ProductService.createProduct(
        req.tenant.businessId,
        req.body,
        files
    );

    res.status(201).json(product);
});

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const { search, status } = req.query;

    const products = await ProductService.getProducts(
        req.tenant.businessId,
        search as string | undefined,
        status as ProductStatus
    );

    res.json(products);
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const product = await ProductService.getProductById(req.tenant.businessId, req.params.productId as string);

    res.json(product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const product = await ProductService.updateProduct(req.tenant.businessId, req.params.productId as string, req.body);

    res.json(product);
});

export const addVariant = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const variant = await ProductService.addVariant(req.tenant.businessId, req.params.productId as string, req.body);

    res.status(201).json(variant);
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const userId = (req as any).userId;
    const { quantity, reason } = req.body;

    const result = await ProductService.adjustStock(
        req.tenant.businessId,
        req.params.variantId as string,
        { quantity, reason, actorId: userId }
    );

    res.json(result);
});

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    if (!req.file)
        throw new ApiError(400, "No image file provided");

    const image = await ProductService.addProductImage(
        req.tenant.businessId,
        req.params.productId as string,
        req.file.buffer
    );
    res.status(201).json(image);
});