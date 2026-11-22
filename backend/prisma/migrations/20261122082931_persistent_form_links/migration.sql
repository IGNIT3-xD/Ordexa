/*
  Warnings:

  - You are about to drop the column `consumedAt` on the `form_tokens` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "order_submissions_formTokenId_key";

-- AlterTable
ALTER TABLE "form_tokens" DROP COLUMN "consumedAt",
ALTER COLUMN "expiresAt" DROP NOT NULL;
