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

    const { search, status, includeDeleted } = (req as any).validatedQuery;

    const products = await ProductService.getProducts(
        req.tenant.businessId,
        search as string | undefined,
        status as ProductStatus,
        includeDeleted as boolean
    );

    res.json(products);
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const { includeDeleted } = req.query

    const product = await ProductService.getProductById(
        req.tenant.businessId,
        req.params.productId as string,
        includeDeleted as unknown as boolean
    );

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

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await ProductService.deleteProduct(req.tenant.businessId, req.params.productId as string);

    res.json(result);
});

export const deleteVariant = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await ProductService.deleteVariant(req.tenant.businessId, req.params.variantId as string);

    res.json(result);
});

export const updateVariant = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await ProductService.updateVariant(
        req.tenant.businessId,
        req.params.variantId as string,
        req.body
    );

    res.json(result);
});

export const restoreProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await ProductService.restoreProduct(req.tenant.businessId, req.params.productId as string);

    res.json(result);
});

export const restoreVariant = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await ProductService.restoreVariant(req.tenant.businessId, req.params.variantId as string);

    res.json(result);
});

export const updateImage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const { isPrimary } = req.body;

    const result = await ProductService.updateImage(
        req.tenant.businessId,
        req.params.productId as string,
        req.params.imageId as string,
        isPrimary
    );

    res.json(result);
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await ProductService.deleteImage(
        req.tenant.businessId,
        req.params.productId as string,
        req.params.imageId as string
    );

    res.json(result);
});