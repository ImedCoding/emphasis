/*
  Warnings:

  - A unique constraint covering the columns `[qrToken]` on the table `Collection` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "qrToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Collection_qrToken_key" ON "Collection"("qrToken");

-- CreateIndex
CREATE INDEX "Collection_userId_verifiedAt_idx" ON "Collection"("userId", "verifiedAt");

-- CreateIndex
CREATE INDEX "Figurine_collection_series_idx" ON "Figurine"("collection", "series");
