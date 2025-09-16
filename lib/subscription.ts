// lib/subscription.ts
import { prisma } from "@/lib/db";

/** Back-compat: if expiresAt is null but status is PAID, treat as active (legacy purchases). */
function isActive(status: string, expiresAt: Date | null): boolean {
  if (status !== "PAID" && status !== "paid") return false;
  if (!expiresAt) return true; // legacy lifetime/old rows
  return expiresAt >= new Date();
}

/** AI access: any active AI enrollment (no quiz/course binding needed). */
export async function userHasActiveAI(userId: string) {
  const row = await prisma.enrollment.findFirst({
    where: {
      userId,
      ai: true,
      status: "PAID",
      // prefer new logic when we have expiresAt
      OR: [{ expiresAt: { gte: new Date() } }, { expiresAt: null }],
    },
    select: { id: true },
  });
  return !!row;
}

/** Offer (without AI) for a specific QUIZ. */
export async function userHasActiveOfferForQuiz(
  userId: string,
  quizId: string
) {
  const row = await prisma.enrollment.findFirst({
    where: {
      userId,
      quizId,
      OR: [{ isOffer: true }, { offer: true }],
      status: { in: ["PAID", "paid"] },
    },
    select: { status: true, expiresAt: true },
  });
  return row ? isActive(row.status, row.expiresAt) : false;
}

/** If you also gate by course: */
export async function userHasActiveOfferForCourse(
  userId: string,
  courseId: string
) {
  const row = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      ai: false,
      status: "PAID",
    },
    select: { status: true, expiresAt: true },
  });
  return row ? isActive(row.status, row.expiresAt) : false;
}

/** Optional: fetch details (useful for UI badges). */
export async function getOfferAccessForQuiz(userId: string, quizId: string) {
  const row = await prisma.enrollment.findFirst({
    where: { userId, quizId, ai: false },
    select: {
      status: true,
      expiresAt: true,
      billingPeriod: true,
      months: true,
      paidAt: true,
    },
  });
  if (!row) return { active: false as const };
  return {
    active: isActive(row.status, row.expiresAt),
    status: row.status,
    expiresAt: row.expiresAt ?? null,
    billingPeriod: row.billingPeriod ?? null,
    months: row.months ?? null,
    paidAt: row.paidAt ?? null,
  };
}
