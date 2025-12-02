/*
  Warnings:

  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `serviceId` on the `EndPoint` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `NotificationLog` table. All the data in the column will be lost.
  - Added the required column `hostId` to the `EndPoint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hostId` to the `NotificationLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Service";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "MonitoredHost" (
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EndPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "hostId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CONFIG',
    "url" TEXT,
    "method" TEXT DEFAULT 'GET',
    "headers" JSONB,
    "timeout" INTEGER,
    "bodyContentType" TEXT DEFAULT 'json',
    "bodyContent" TEXT,
    "codeContent" TEXT,
    "intervalTime" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "EndPoint_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "MonitoredHost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EndPoint" ("bodyContent", "bodyContentType", "codeContent", "createdAt", "enabled", "headers", "id", "intervalTime", "method", "name", "timeout", "type", "updatedAt", "url") SELECT "bodyContent", "bodyContentType", "codeContent", "createdAt", "enabled", "headers", "id", "intervalTime", "method", "name", "timeout", "type", "updatedAt", "url" FROM "EndPoint";
DROP TABLE "EndPoint";
ALTER TABLE "new_EndPoint" RENAME TO "EndPoint";
CREATE TABLE "new_NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hostId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMsg" TEXT
);
INSERT INTO "new_NotificationLog" ("channelId", "content", "createdAt", "endpointId", "errorMsg", "eventType", "id", "success", "title") SELECT "channelId", "content", "createdAt", "endpointId", "errorMsg", "eventType", "id", "success", "title" FROM "NotificationLog";
DROP TABLE "NotificationLog";
ALTER TABLE "new_NotificationLog" RENAME TO "NotificationLog";
CREATE INDEX "NotificationLog_hostId_idx" ON "NotificationLog"("hostId");
CREATE INDEX "NotificationLog_endpointId_idx" ON "NotificationLog"("endpointId");
CREATE INDEX "NotificationLog_channelId_idx" ON "NotificationLog"("channelId");
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
