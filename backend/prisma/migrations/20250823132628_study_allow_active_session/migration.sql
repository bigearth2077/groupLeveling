-- AlterTable
ALTER TABLE "public"."StudySession" ALTER COLUMN "endTime" DROP NOT NULL,
ALTER COLUMN "durationMinutes" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "StudySession_userId_endTime_idx" ON "public"."StudySession"("userId", "endTime");

-- CreateIndex
CREATE INDEX "StudySession_userId_startTime_idx" ON "public"."StudySession"("userId", "startTime");
