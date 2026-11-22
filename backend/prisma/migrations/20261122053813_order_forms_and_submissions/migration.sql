-- CreateEnum
CREATE TYPE "OrderSubmissionStatus" AS ENUM ('PENDING', 'CONVERTED', 'REJECTED');

-- CreateTable
CREATE TABLE "order_forms" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_tokens" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_submissions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "formTokenId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "status" "OrderSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_tokens_tokenHash_key" ON "form_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "order_submissions_formTokenId_key" ON "order_submissions"("formTokenId");

-- CreateIndex
CREATE INDEX "order_submissions_businessId_status_idx" ON "order_submissions"("businessId", "status");

-- AddForeignKey
ALTER TABLE "order_forms" ADD CONSTRAINT "order_forms_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_tokens" ADD CONSTRAINT "form_tokens_formId_fkey" FOREIGN KEY ("formId") REFERENCES "order_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_submissions" ADD CONSTRAINT "order_submissions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_submissions" ADD CONSTRAINT "order_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "order_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_submissions" ADD CONSTRAINT "order_submissions_formTokenId_fkey" FOREIGN KEY ("formTokenId") REFERENCES "form_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
