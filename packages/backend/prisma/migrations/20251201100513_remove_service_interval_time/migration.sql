/*
  Warnings:

  - You are about to drop the column `intervalTime` on the `Service` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "headers" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notifyFailureCount" INTEGER NOT NULL DEFAULT 3,
    "notifyCooldownMin" INTEGER NOT NULL DEFAULT 30,
    "notifyChannelIds" JSONB NOT NULL DEFAULT []
);
INSERT INTO "new_Service" ("createdAt", "enabled", "headers", "id", "name", "notifyChannelIds", "notifyCooldownMin", "notifyEnabled", "notifyFailureCount", "updatedAt", "url") SELECT "createdAt", "enabled", "headers", "id", "name", "notifyChannelIds", "notifyCooldownMin", "notifyEnabled", "notifyFailureCount", "updatedAt", "url" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
