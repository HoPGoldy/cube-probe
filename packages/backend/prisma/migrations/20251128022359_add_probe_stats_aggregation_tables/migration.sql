-- CreateTable
CREATE TABLE "ProbeHourlyStat" (
    "endPointId" TEXT NOT NULL,
    "hourTimestamp" DATETIME NOT NULL,
    "totalChecks" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "avgResponseTime" INTEGER,
    "minResponseTime" INTEGER,
    "maxResponseTime" INTEGER,

    PRIMARY KEY ("endPointId", "hourTimestamp"),
    CONSTRAINT "ProbeHourlyStat_endPointId_fkey" FOREIGN KEY ("endPointId") REFERENCES "EndPoint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProbeDailyStat" (
    "endPointId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "totalChecks" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "uptimePercentage" REAL,
    "avgResponseTime" INTEGER,
    "minResponseTime" INTEGER,
    "maxResponseTime" INTEGER,

    PRIMARY KEY ("endPointId", "date"),
    CONSTRAINT "ProbeDailyStat_endPointId_fkey" FOREIGN KEY ("endPointId") REFERENCES "EndPoint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProbeHourlyStat_hourTimestamp_idx" ON "ProbeHourlyStat"("hourTimestamp");

-- CreateIndex
CREATE INDEX "ProbeDailyStat_date_idx" ON "ProbeDailyStat"("date");
