import PDFDocument from "pdfkit";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";

export class InvoiceService {
    static async generateInvoiceBuffer(invoiceToken: string): Promise<{ buffer: Buffer, fileName: string }> {
        const order = await prisma.order.findUnique({
            where: { invoiceToken },
            include: {
                business: true,
                items: true,
                shipment: true,
            },
        });

        if (!order)
            throw new ApiError(404, "Order not found");

        const pdfBuffer = await this.createPdfBuffer(order);
        const fileName = `invoice-${order.orderNumber}.pdf`;

        return { buffer: pdfBuffer, fileName };
    }

    private static createPdfBuffer(order: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", (err) => reject(err));

            // --- HEADER ---
            doc.fontSize(20).text(order.business.name.toUpperCase(), { align: "center" });
            doc.fontSize(10).text("Order Invoice", { align: "center" });
            doc.moveDown(2);

            // --- ORDER DETAILS ---
            doc.fontSize(12).text(`Order Number: ${order.orderNumber}`);
            doc.fontSize(10).text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
            doc.moveDown();

            // --- CUSTOMER DETAILS ---
            doc.fontSize(12).text("Billed To:");
            doc.fontSize(10).text(order.customerName);
            doc.text(order.customerPhone);
            doc.text(order.deliveryAddress);
            doc.moveDown(2);

            // --- TABLE HEADER ---
            const tableTop = doc.y;
            doc.fontSize(10).font("Helvetica-Bold");
            doc.text("Item", 50, tableTop);
            doc.text("Qty", 300, tableTop);
            doc.text("Price", 370, tableTop);
            doc.text("Total", 450, tableTop);

            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
            doc.font("Helvetica");

            // --- TABLE ROWS ---
            let yPosition = tableTop + 25;
            order.items.forEach((item: any) => {
                doc.text(item.productName, 50, yPosition);
                doc.fontSize(8).fillColor("gray").text(item.variantName, 50, yPosition + 12).fillColor("black").fontSize(10);

                doc.text(item.quantity.toString(), 300, yPosition);
                doc.text(`BDT ${item.unitPrice}`, 370, yPosition);
                doc.text(`BDT ${item.lineTotal}`, 450, yPosition);

                yPosition += 30;
            });

            doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
            yPosition += 15;

            // --- TOTAL ---
            doc.fontSize(12).font("Helvetica-Bold");
            doc.text("Total Amount:", 370, yPosition);
            doc.text(`BDT ${order.totalAmount}`, 450, yPosition);

            // --- TRACKING INFO ---
            if (order.shipment?.trackingCode) {
                doc.moveDown(3).fontSize(10).font("Helvetica");
                doc.text(`Tracking Code: ${order.shipment.trackingCode} (via ${order.shipment.provider})`);
            }

            doc.end();
        });
    }
}