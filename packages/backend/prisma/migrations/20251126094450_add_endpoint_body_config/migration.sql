-- AlterTable
ALTER TABLE "EndPoint" ADD COLUMN "bodyContent" JSONB;
ALTER TABLE "EndPoint" ADD COLUMN "bodyContentType" TEXT DEFAULT 'json';
