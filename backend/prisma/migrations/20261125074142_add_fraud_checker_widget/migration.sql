/*
  Warnings:

  - You are about to drop the column `fraudData` on the `order_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `fraudScore` on the `order_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `fraudStatus` on the `order_submissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "order_submissions" DROP COLUMN "fraudData",
DROP COLUMN "fraudScore",
DROP COLUMN "fraudStatus";

-- CreateTable
CREATE TABLE "fraud_checks" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fraud_checks_phone_idx" ON "fraud_checks"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_checks_businessId_phone_key" ON "fraud_checks"("businessId", "phone");
