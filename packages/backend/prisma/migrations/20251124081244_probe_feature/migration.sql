-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "headers" JSONB,
    "cronExpression" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "EndPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "headers" JSONB,
    "cronExpression" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "timeout" INTEGER,
    CONSTRAINT "EndPoint_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProbeResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endPointId" TEXT NOT NULL,
    "status" INTEGER,
    "responseTime" INTEGER,
    "timestamp" DATETIME NOT NULL,
    "success" BOOLEAN NOT NULL,
    "message" TEXT,
    CONSTRAINT "ProbeResult_endPointId_fkey" FOREIGN KEY ("endPointId") REFERENCES "EndPoint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
