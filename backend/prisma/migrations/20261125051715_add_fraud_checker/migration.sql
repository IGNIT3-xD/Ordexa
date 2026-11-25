-- CreateEnum
CREATE TYPE "FraudStatus" AS ENUM ('UNCHECKED', 'SAFE', 'RISKY', 'FAILED');

-- AlterTable
ALTER TABLE "order_submissions" ADD COLUMN     "fraudData" JSONB,
ADD COLUMN     "fraudScore" INTEGER,
ADD COLUMN     "fraudStatus" "FraudStatus";
