-- CreateTable
CREATE TABLE "NotificationChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "headers" JSONB,
    "bodyTemplate" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scopeType" TEXT NOT NULL DEFAULT 'ALL',
    "hostId" TEXT,
    "endpointId" TEXT,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 3,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 30,
    "notifyOnRecovery" BOOLEAN NOT NULL DEFAULT true,
    "channelId" TEXT NOT NULL,
    CONSTRAINT "NotificationRule_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "NotificationChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationRule_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "NotificationRule_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "EndPoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ruleId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMsg" TEXT
);

-- CreateIndex
CREATE INDEX "NotificationRule_hostId_idx" ON "NotificationRule"("hostId");

-- CreateIndex
CREATE INDEX "NotificationRule_endpointId_idx" ON "NotificationRule"("endpointId");

-- CreateIndex
CREATE INDEX "NotificationRule_channelId_idx" ON "NotificationRule"("channelId");

-- CreateIndex
CREATE INDEX "NotificationLog_ruleId_idx" ON "NotificationLog"("ruleId");

-- CreateIndex
CREATE INDEX "NotificationLog_endpointId_idx" ON "NotificationLog"("endpointId");

-- CreateIndex
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");
