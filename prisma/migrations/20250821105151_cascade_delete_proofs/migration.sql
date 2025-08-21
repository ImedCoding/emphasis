-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PhotoProof" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collectionId" TEXT NOT NULL,
    "urlImage" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhotoProof_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PhotoProof" ("collectionId", "id", "timestamp", "urlImage") SELECT "collectionId", "id", "timestamp", "urlImage" FROM "PhotoProof";
DROP TABLE "PhotoProof";
ALTER TABLE "new_PhotoProof" RENAME TO "PhotoProof";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
