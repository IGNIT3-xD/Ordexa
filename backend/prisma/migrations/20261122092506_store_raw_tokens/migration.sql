/*
  Warnings:

  - You are about to drop the column `tokenHash` on the `form_tokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `form_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `form_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "form_tokens_tokenHash_key";

-- AlterTable
ALTER TABLE "form_tokens" DROP COLUMN "tokenHash",
ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "form_tokens_token_key" ON "form_tokens"("token");
