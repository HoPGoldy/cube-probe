-- CreateTable
CREATE TABLE "ProbeEnv" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "desc" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "ProbeEnv_key_key" ON "ProbeEnv"("key");
