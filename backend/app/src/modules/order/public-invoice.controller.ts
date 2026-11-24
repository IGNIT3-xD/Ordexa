import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/AppError.js";
import { InvoiceService } from "./invoice.service.js";
import { prisma } from "../../lib/prisma.js";

export const downloadInvoice = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.orderId as string;

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order)
        throw new ApiError(404, "Order not found");

    // 2. Generate the PDF buffer
    const { buffer, fileName } = await InvoiceService.generateInvoiceBuffer(orderId);

    // 3. Stream the PDF directly to the browser
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
});