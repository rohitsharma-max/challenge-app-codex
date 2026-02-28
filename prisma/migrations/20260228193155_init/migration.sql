-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('Fitness', 'Productivity', 'Learning', 'Fun', 'Social');

-- CreateEnum
CREATE TYPE "public"."Difficulty" AS ENUM ('Easy', 'Medium', 'Hard');

-- CreateEnum
CREATE TYPE "public"."DayStatus" AS ENUM ('assigned', 'completed', 'missed', 'restored');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "difficulty" "public"."Difficulty",
    "allowOutdoor" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "public"."Category" NOT NULL,

    CONSTRAINT "UserCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Streak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "best" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedDateKey" TEXT,
    "frozenBeforeMiss" INTEGER,
    "restorableMissedDateKey" TEXT,
    "restoreDeadline" TIMESTAMP(3),

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChallengeRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "challengeText" TEXT NOT NULL,
    "category" "public"."Category" NOT NULL,
    "difficulty" "public"."Difficulty" NOT NULL,
    "outdoor" BOOLEAN NOT NULL,
    "status" "public"."DayStatus" NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "proofNote" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "UserCategory_userId_idx" ON "public"."UserCategory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCategory_userId_category_key" ON "public"."UserCategory"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Streak_userId_key" ON "public"."Streak"("userId");

-- CreateIndex
CREATE INDEX "ChallengeRecord_userId_dateKey_idx" ON "public"."ChallengeRecord"("userId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeRecord_userId_dateKey_key" ON "public"."ChallengeRecord"("userId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "public"."Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- AddForeignKey
ALTER TABLE "public"."UserCategory" ADD CONSTRAINT "UserCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeRecord" ADD CONSTRAINT "ChallengeRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
