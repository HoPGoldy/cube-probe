/*
  Warnings:

  - You are about to drop the column `timestamp` on the `ProbeResult` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProbeResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
