/*
  Warnings:

  - Added the required column `collection` to the `Figurine` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Figurine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "imageRef" TEXT NOT NULL
);
INSERT INTO "new_Figurine" ("id", "imageRef", "name", "series") SELECT "id", "imageRef", "name", "series" FROM "Figurine";
DROP TABLE "Figurine";
ALTER TABLE "new_Figurine" RENAME TO "Figurine";
CREATE UNIQUE INDEX "Figurine_collection_series_name_key" ON "Figurine"("collection", "series", "name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
