/*
  Warnings:

  - You are about to drop the `NotificationRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `ruleId` on the `NotificationLog` table. All the data in the column will be lost.
  - Added the required column `channelId` to the `NotificationLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceId` to the `NotificationLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "NotificationRule_channelId_idx";

-- DropIndex
DROP INDEX "NotificationRule_endpointId_idx";

-- DropIndex
DROP INDEX "NotificationRule_hostId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "NotificationRule";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMsg" TEXT
);
INSERT INTO "new_NotificationLog" ("content", "createdAt", "endpointId", "errorMsg", "eventType", "id", "success", "title") SELECT "content", "createdAt", "endpointId", "errorMsg", "eventType", "id", "success", "title" FROM "NotificationLog";
DROP TABLE "NotificationLog";
ALTER TABLE "new_NotificationLog" RENAME TO "NotificationLog";
CREATE INDEX "NotificationLog_serviceId_idx" ON "NotificationLog"("serviceId");
CREATE INDEX "NotificationLog_endpointId_idx" ON "NotificationLog"("endpointId");
CREATE INDEX "NotificationLog_channelId_idx" ON "NotificationLog"("channelId");
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "headers" JSONB,
    "intervalTime" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notifyFailureCount" INTEGER NOT NULL DEFAULT 3,
    "notifyCooldownMin" INTEGER NOT NULL DEFAULT 30,
    "notifyChannelIds" JSONB NOT NULL DEFAULT []
);
INSERT INTO "new_Service" ("createdAt", "enabled", "headers", "id", "intervalTime", "name", "updatedAt", "url") SELECT "createdAt", "enabled", "headers", "id", "intervalTime", "name", "updatedAt", "url" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
