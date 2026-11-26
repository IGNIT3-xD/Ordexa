/*
  Warnings:

  - A unique constraint covering the columns `[invoiceToken]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "invoiceToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_invoiceToken_key" ON "orders"("invoiceToken");
