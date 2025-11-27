/*
  Warnings:

  - The primary key for the `ProbeResult` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `ProbeResult` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProbeResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endPointId" TEXT NOT NULL,
    "status" INTEGER,
    "responseTime" INTEGER,
    "success" BOOLEAN NOT NULL,
    "message" TEXT,
    CONSTRAINT "ProbeResult_endPointId_fkey" FOREIGN KEY ("endPointId") REFERENCES "EndPoint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProbeResult" ("createdAt", "endPointId", "id", "message", "responseTime", "status", "success") SELECT "createdAt", "endPointId", "id", "message", "responseTime", "status", "success" FROM "ProbeResult";
DROP TABLE "ProbeResult";
ALTER TABLE "new_ProbeResult" RENAME TO "ProbeResult";
CREATE INDEX "ProbeResult_endPointId_createdAt_idx" ON "ProbeResult"("endPointId", "createdAt" DESC);
CREATE INDEX "ProbeResult_createdAt_idx" ON "ProbeResult"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
