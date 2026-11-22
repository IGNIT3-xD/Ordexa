import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/AppError.js";
import { SubmissionService } from "./submission.service.js";

export const listSubmissions = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const { status, page, limit } = (req as any).validatedQuery;

    const result = await SubmissionService.listSubmissions(
        req.tenant.businessId,
        status,
        page,
        limit
    );

    res.json(result);
});

export const getSubmission = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await SubmissionService.getSubmission(
        req.tenant.businessId,
        req.params.submissionId as string
    );

    res.json(result);
});

export const rejectSubmission = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const { reason } = req.body;

    const result = await SubmissionService.rejectSubmission(
        req.tenant.businessId,
        req.params.submissionId as string,
        reason
    );

    res.json(result);
});

export const convertToOrder = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const result = await SubmissionService.convertToOrder(
        req.tenant.businessId,
        req.params.submissionId as string
    );

    res.status(201).json(result);
});

export const updateSubmissionStatus = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const { status, rejectionReason } = req.body;

    const result = await SubmissionService.updateSubmissionStatus(
        req.tenant.businessId,
        req.params.submissionId as string,
        status,
        rejectionReason
    );

    res.json(result);
});