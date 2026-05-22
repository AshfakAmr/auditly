-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('X', 'LINKEDIN');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "profileHandle" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PROCESSING',
    "providerUsed" TEXT,
    "rawPosts" JSONB,
    "normalizedData" JSONB,
    "metrics" JSONB,
    "classifications" JSONB,
    "finalReport" JSONB,
    "latestPostId" TEXT,
    "latestPostDate" TIMESTAMP(3),
    "postsAnalyzedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_email_idx" ON "Report"("email");

-- CreateIndex
CREATE INDEX "Report_platform_profileHandle_idx" ON "Report"("platform", "profileHandle");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");
