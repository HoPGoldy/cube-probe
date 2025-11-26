/*
  Warnings:

  - You are about to drop the column `cronExpression` on the `EndPoint` table. All the data in the column will be lost.
  - You are about to drop the column `cronExpression` on the `Service` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EndPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "headers" JSONB,
    "intervalTime" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "timeout" INTEGER,
    CONSTRAINT "EndPoint_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EndPoint" ("createdAt", "enabled", "headers", "id", "name", "serviceId", "timeout", "updatedAt", "url") SELECT "createdAt", "enabled", "headers", "id", "name", "serviceId", "timeout", "updatedAt", "url" FROM "EndPoint";
DROP TABLE "EndPoint";
ALTER TABLE "new_EndPoint" RENAME TO "EndPoint";
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "headers" JSONB,
    "intervalTime" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Service" ("createdAt", "enabled", "headers", "id", "name", "updatedAt", "url") SELECT "createdAt", "enabled", "headers", "id", "name", "updatedAt", "url" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
