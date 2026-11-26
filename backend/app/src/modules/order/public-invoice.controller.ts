import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { InvoiceService } from "./invoice.service.js";

export const downloadInvoice = asyncHandler(async (req: Request, res: Response) => {
    const invoiceToken = req.params.token as string;

    // Generate the PDF buffer (throws 404 if the token is unknown)
    const { buffer, fileName } = await InvoiceService.generateInvoiceBuffer(invoiceToken);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.send(buffer);
});
