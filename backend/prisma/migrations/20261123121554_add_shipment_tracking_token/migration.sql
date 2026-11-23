/*
  Warnings:

  - A unique constraint covering the columns `[trackingToken]` on the table `shipments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trackingToken` to the `shipments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "trackingToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "shipments_trackingToken_key" ON "shipments"("trackingToken");
