-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EndPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "serviceId" TEXT NOT NULL,
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
    CONSTRAINT "EndPoint_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EndPoint" ("bodyContent", "bodyContentType", "createdAt", "enabled", "headers", "id", "intervalTime", "method", "name", "serviceId", "timeout", "updatedAt", "url") SELECT "bodyContent", "bodyContentType", "createdAt", "enabled", "headers", "id", "intervalTime", "method", "name", "serviceId", "timeout", "updatedAt", "url" FROM "EndPoint";
DROP TABLE "EndPoint";
ALTER TABLE "new_EndPoint" RENAME TO "EndPoint";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
