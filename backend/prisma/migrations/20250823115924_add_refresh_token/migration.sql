/*
  Warnings:

  - You are about to drop the column `revoked` on the `RefreshToken` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."RefreshToken_tokenHash_key";

-- AlterTable
ALTER TABLE "public"."RefreshToken" DROP COLUMN "revoked",
ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "public"."RefreshToken"("tokenHash");
