import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";
import { buildDailyChallenge, xpForDifficulty } from "@/lib/challenges";
import { addDays, dateKey, diffDays, endOfDayIso } from "@/lib/date";
import { db } from "@/lib/db";
import { Category, Difficulty, HistoryRecord, User, UserPreferences } from "@/types/app";

function newToken(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

type UserWithRelations = Prisma.UserGetPayload<{
  include: { streak: true; categories: true };
}>;

type ChallengeRecordRow = Prisma.ChallengeRecordGetPayload<Record<string, never>>;

function mapPreferences(user: UserWithRelations): UserPreferences | undefined {
  if (!user.onboardingComplete || !user.difficulty) return undefined;
  return {
    categories: user.categories.map((c) => c.category as Category),
    difficulty: user.difficulty as Difficulty,
    allowOutdoor: user.allowOutdoor
  };
}

function mapUser(user: UserWithRelations): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    onboardingComplete: user.onboardingComplete,
    preferences: mapPreferences(user),
    xp: user.xp,
    streak: {
      current: user.streak?.current ?? 0,
      best: user.streak?.best ?? 0,
      lastCompletedDate: user.streak?.lastCompletedDateKey ?? undefined,
      frozenBeforeMiss: user.streak?.frozenBeforeMiss ?? undefined,
      restorableMissedDate: user.streak?.restorableMissedDateKey ?? undefined,
      restoreDeadline: user.streak?.restoreDeadline?.toISOString()
    },
    history: []
  };
}

function mapHistoryRecord(row: ChallengeRecordRow): HistoryRecord {
  return {
    date: row.dateKey,
    challenge: {
      id: row.challengeId,
      text: row.challengeText,
      category: row.category as Category,
      difficulty: row.difficulty as Difficulty,
      outdoor: row.outdoor
    },
    status: row.status as HistoryRecord["status"],
    xpEarned: row.xpEarned,
    proofNote: row.proofNote ?? undefined,
    completedAt: row.completedAt?.toISOString()
  };
}

async function getUserState(client: PrismaClient | Prisma.TransactionClient, userId: string) {
  return client.user.findUnique({
    where: { id: userId },
    include: { streak: true, categories: true }
  });
}

async function ensureUserHasStreak(
  client: Prisma.TransactionClient,
  user: UserWithRelations
): Promise<UserWithRelations> {
  if (user.streak) return user;
  const streak = await client.streak.create({ data: { userId: user.id } });
  return { ...user, streak };
}

async function ensureMissedState(
  client: Prisma.TransactionClient,
  user: UserWithRelations,
  today: string
): Promise<UserWithRelations> {
  const streak = user.streak;
  if (!streak || !streak.lastCompletedDateKey) return user;

  const gap = diffDays(streak.lastCompletedDateKey, today);
  if (gap <= 1) return user;

  if (gap === 2) {
    const missedDate = addDays(streak.lastCompletedDateKey, 1);
    if (streak.restorableMissedDateKey === missedDate) return user;

    const updates = {
      current: 0,
      frozenBeforeMiss: streak.current,
      restorableMissedDateKey: missedDate,
      restoreDeadline: new Date(endOfDayIso(today))
    };
    await client.streak.update({ where: { userId: user.id }, data: updates });

    const existingMissed = await client.challengeRecord.findUnique({
      where: { userId_dateKey: { userId: user.id, dateKey: missedDate } }
    });

    if (existingMissed) {
      await client.challengeRecord.update({
        where: { id: existingMissed.id },
        data: { status: "missed", xpEarned: 0 }
      });
    } else if (user.difficulty && user.categories.length > 0) {
      const challenge = buildDailyChallenge({
        userId: user.id,
        date: missedDate,
        categories: user.categories.map((c) => c.category as Category),
        difficulty: user.difficulty as Difficulty,
        allowOutdoor: user.allowOutdoor
      });
      await client.challengeRecord.create({
        data: {
          userId: user.id,
          dateKey: missedDate,
          challengeId: challenge.id,
          challengeText: challenge.text,
          category: challenge.category,
          difficulty: challenge.difficulty,
          outdoor: challenge.outdoor,
          status: "missed",
          xpEarned: 0
        }
      });
    }

    return {
      ...user,
      streak: {
        ...streak,
        ...updates
      }
    };
  }

  await client.streak.update({
    where: { userId: user.id },
    data: {
      current: 0,
      frozenBeforeMiss: null,
      restorableMissedDateKey: null,
      restoreDeadline: null
    }
  });

  return {
    ...user,
    streak: {
      ...streak,
      current: 0,
      frozenBeforeMiss: null,
      restorableMissedDateKey: null,
      restoreDeadline: null
    }
  };
}

export async function createUser(input: { name: string; email: string; password: string }): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const created = await db.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
        streak: { create: {} }
      },
      include: { streak: true, categories: true }
    });
    return mapUser(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Email already registered");
    }
    throw error;
  }
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { streak: true, categories: true }
  });
  if (!user) return null;

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return null;

  return mapUser(user);
}

export async function createSession(userId: string): Promise<string> {
  const token = newToken("sess");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await db.session.create({ data: { token, userId, expiresAt } });
  return token;
}

export async function getUserBySession(token?: string): Promise<User | null> {
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: { include: { streak: true, categories: true } } }
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session.delete({ where: { token } }).catch(() => undefined);
    return null;
  }

  return mapUser(session.user);
}

export async function destroySession(token?: string): Promise<void> {
  if (!token) return;
  await db.session.deleteMany({ where: { token } });
}

export async function setUserPreferences(userId: string, prefs: UserPreferences): Promise<User> {
  const updated = await db.$transaction(async (tx) => {
    await tx.userCategory.deleteMany({ where: { userId } });
    await tx.userCategory.createMany({
      data: prefs.categories.map((category) => ({ userId, category })),
      skipDuplicates: true
    });

    return tx.user.update({
      where: { id: userId },
      data: {
        onboardingComplete: true,
        difficulty: prefs.difficulty,
        allowOutdoor: prefs.allowOutdoor
      },
      include: { streak: true, categories: true }
    });
  });

  return mapUser(updated);
}

export async function getOrCreateTodayChallenge(
  userId: string
): Promise<{ user: User; todayRecord: HistoryRecord }> {
  return db.$transaction(async (tx) => {
    let user = await getUserState(tx, userId);
    if (!user) throw new Error("User not found");
    if (!user.difficulty || user.categories.length === 0) throw new Error("Complete onboarding first");
    user = await ensureUserHasStreak(tx, user);

    const today = dateKey();
    user = await ensureMissedState(tx, user, today);

    let todayRecord = await tx.challengeRecord.findUnique({
      where: { userId_dateKey: { userId: user.id, dateKey: today } }
    });

    if (!todayRecord) {
      const challenge = buildDailyChallenge({
        userId: user.id,
        date: today,
        categories: user.categories.map((c) => c.category as Category),
        difficulty: user.difficulty as Difficulty,
        allowOutdoor: user.allowOutdoor
      });

      todayRecord = await tx.challengeRecord.create({
        data: {
          userId: user.id,
          dateKey: today,
          challengeId: challenge.id,
          challengeText: challenge.text,
          category: challenge.category,
          difficulty: challenge.difficulty,
          outdoor: challenge.outdoor,
          status: "assigned"
        }
      });
    }

    const freshUser = await getUserState(tx, userId);
    if (!freshUser) throw new Error("User not found");

    return { user: mapUser(freshUser), todayRecord: mapHistoryRecord(todayRecord) };
  });
}

export async function completeTodayChallenge(
  userId: string,
  proofNote?: string
): Promise<{ user: User; xpEarned: number }> {
  return db.$transaction(async (tx) => {
    let user = await getUserState(tx, userId);
    if (!user) throw new Error("User not found");
    if (!user.difficulty || user.categories.length === 0) throw new Error("Complete onboarding first");
    user = await ensureUserHasStreak(tx, user);

    const today = dateKey();
    user = await ensureMissedState(tx, user, today);

    let record = await tx.challengeRecord.findUnique({
      where: { userId_dateKey: { userId, dateKey: today } }
    });

    if (!record) {
      const challenge = buildDailyChallenge({
        userId: user.id,
        date: today,
        categories: user.categories.map((c) => c.category as Category),
        difficulty: user.difficulty as Difficulty,
        allowOutdoor: user.allowOutdoor
      });
      record = await tx.challengeRecord.create({
        data: {
          userId: user.id,
          dateKey: today,
          challengeId: challenge.id,
          challengeText: challenge.text,
          category: challenge.category,
          difficulty: challenge.difficulty,
          outdoor: challenge.outdoor,
          status: "assigned"
        }
      });
    }

    if (record.status === "completed") {
      const unchanged = await getUserState(tx, userId);
      if (!unchanged) throw new Error("User not found");
      return { user: mapUser(unchanged), xpEarned: 0 };
    }

    const xpGained = xpForDifficulty(record.difficulty as Difficulty);
    const previousDate = user.streak?.lastCompletedDateKey;
    const current = user.streak?.current ?? 0;
    const best = user.streak?.best ?? 0;
    const nextCurrent = previousDate === addDays(today, -1) ? current + 1 : 1;
    const nextBest = Math.max(best, nextCurrent);

    await tx.user.update({
      where: { id: userId },
      data: { xp: { increment: xpGained } }
    });

    await tx.streak.update({
      where: { userId },
      data: {
        current: nextCurrent,
        best: nextBest,
        lastCompletedDateKey: today
      }
    });

    await tx.challengeRecord.update({
      where: { id: record.id },
      data: {
        status: "completed",
        xpEarned: xpGained,
        proofNote: proofNote || null,
        completedAt: new Date()
      }
    });

    const freshUser = await getUserState(tx, userId);
    if (!freshUser) throw new Error("User not found");
    return { user: mapUser(freshUser), xpEarned: xpGained };
  });
}

export async function restoreMissedStreak(userId: string): Promise<{ user: User; cost: number }> {
  const cost = 50;

  return db.$transaction(async (tx) => {
    const user = await getUserState(tx, userId);
    if (!user) throw new Error("User not found");
    const userWithStreak = await ensureUserHasStreak(tx, user);

    const missedDate = userWithStreak.streak?.restorableMissedDateKey;
    const deadline = userWithStreak.streak?.restoreDeadline;

    if (!missedDate || !deadline) {
      throw new Error("No restorable streak available");
    }

    if (deadline.getTime() <= Date.now()) {
      await tx.streak.update({
        where: { userId },
        data: {
          restorableMissedDateKey: null,
          restoreDeadline: null,
          frozenBeforeMiss: null
        }
      });
      throw new Error("Restore window expired");
    }

    if (userWithStreak.xp < cost) {
      throw new Error("Not enough XP to restore streak");
    }

    const restoredCurrent = (userWithStreak.streak?.frozenBeforeMiss ?? 0) + 1;
    const restoredBest = Math.max(userWithStreak.streak?.best ?? 0, restoredCurrent);

    await tx.user.update({
      where: { id: userId },
      data: { xp: { decrement: cost } }
    });

    await tx.streak.update({
      where: { userId },
      data: {
        current: restoredCurrent,
        best: restoredBest,
        lastCompletedDateKey: missedDate,
        restorableMissedDateKey: null,
        restoreDeadline: null,
        frozenBeforeMiss: null
      }
    });

    const missedRecord = await tx.challengeRecord.findUnique({
      where: { userId_dateKey: { userId, dateKey: missedDate } }
    });
    if (missedRecord) {
      await tx.challengeRecord.update({
        where: { id: missedRecord.id },
        data: { status: "restored" }
      });
    }

    const freshUser = await getUserState(tx, userId);
    if (!freshUser) throw new Error("User not found");
    return { user: mapUser(freshUser), cost };
  });
}

export async function getHistory(userId: string): Promise<HistoryRecord[]> {
  const rows = await db.challengeRecord.findMany({
    where: { userId },
    orderBy: { dateKey: "desc" }
  });
  return rows.map(mapHistoryRecord);
}
