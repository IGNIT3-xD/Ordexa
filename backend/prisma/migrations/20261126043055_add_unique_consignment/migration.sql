/*
  Warnings:

  - A unique constraint covering the columns `[consignmentId]` on the table `shipments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "shipments_consignmentId_key" ON "shipments"("consignmentId");
