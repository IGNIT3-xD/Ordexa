import "dotenv/config";
import crypto from "node:crypto";
import { prisma } from "../app/src/lib/prisma.js";
import { env } from "../app/src/config/env.js";

async function main() {
    // Backfill confirmed orders that predate the invoice-token change.
    const orders = await prisma.order.findMany({
        where: {
            status: "CONFIRM",
            OR: [{ invoiceToken: null }, { invoiceUrl: null }],
        },
        select: { id: true, invoiceToken: true },
    });

    if (orders.length === 0) {
        console.log("✅ No invoices need backfilling.");
        return;
    }

    let updated = 0;

    for (const order of orders) {
        const token = order.invoiceToken ?? crypto.randomBytes(32).toString("hex");

        await prisma.order.update({
            where: { id: order.id },
            data: {
                invoiceToken: token,
                invoiceUrl: `${env.BACKEND_URL}/api/public/invoices/${token}`,
            },
        });

        updated++;
    }

    console.log(`✅ Backfilled invoice tokens for ${updated} order(s).`);
}

main()
    .catch((error) => {
        console.error("❌ Invoice backfill failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
