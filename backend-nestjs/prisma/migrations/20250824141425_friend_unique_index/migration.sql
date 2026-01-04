/*
  Warnings:

  - A unique constraint covering the columns `[userId,friendId]` on the table `Friend` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Friend_friendId_status_idx" ON "public"."Friend"("friendId", "status");

-- CreateIndex
CREATE INDEX "Friend_userId_status_idx" ON "public"."Friend"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Friend_userId_friendId_key" ON "public"."Friend"("userId", "friendId");
