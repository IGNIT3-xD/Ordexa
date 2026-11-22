import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/AppError.js";
import { FormService } from "./forms.service.js";

// AUTHENTICATED
export const createForm = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const form = await FormService.createForm(req.tenant.businessId, req.body);

    res.status(201).json(form);
});

export const listForms = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const forms = await FormService.listForms(req.tenant.businessId);

    res.json(forms);
});

export const generateToken = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await FormService.generateToken(req.tenant.businessId, req.params.formId as string);

    res.json(result);
});

export const updateFormStatus = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const { isActive } = req.body;

    const form = await FormService.updateFormStatus(req.tenant.businessId, req.params.formId as string, isActive);

    res.json(form);
});

// PUBLIC (No Auth)
export const getPublicForm = asyncHandler(async (req: Request, res: Response) => {
    const result = await FormService.getPublicForm(req.params.token as string);
    res.json(result);
});

export const submitOrder = asyncHandler(async (req: Request, res: Response) => {
    const result = await FormService.submitOrder(req.params.token as string, req.body);
    res.status(201).json(result);
});
