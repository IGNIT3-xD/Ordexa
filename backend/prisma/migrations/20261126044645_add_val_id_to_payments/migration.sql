/*
  Warnings:

  - A unique constraint covering the columns `[valId]` on the table `billing_payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "billing_payments" ADD COLUMN     "valId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "billing_payments_valId_key" ON "billing_payments"("valId");
