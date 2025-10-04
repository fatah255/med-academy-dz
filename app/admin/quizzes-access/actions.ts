// app/admin/quizzes-access/actions.ts
"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";

export async function findUserWithQuizEnrollments(email: string) {
  const session = await requireAdmin();

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!user)
    return {
      user: null,
      enrollments: [] as Array<{ quizId: string; status: string }>,
    };

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, quizId: { not: null } },
    select: {
      quizId: true,
      status: true,
      billingPeriod: true,
      ai: true,
      expiresAt: true,
      paidAt: true,
    },
  });

  return { user, enrollments };
}

export async function grantQuizzesToUser(input: {
  email: string;
  quizIds: string[];
  billing: "MONTHLY" | "YEARLY";
  includeAi: boolean;
}) {
  const session = await requireAdmin();

  const { email, quizIds, billing, includeAi } = input;
  if (!email || !quizIds?.length) return { ok: true, updated: 0 };

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  if (!user) throw new Error("User not found: " + email);

  const quizzes = await prisma.quiz.findMany({
    where: { id: { in: quizIds } },
    select: { id: true, price: true },
  });
  const priceById = new Map(quizzes.map((q) => [q.id, q.price]));

  const months = billing === "MONTHLY" ? 1 : 12;
  const paidAt = new Date();
  const expiresAt = new Date(paidAt);
  expiresAt.setMonth(expiresAt.getMonth() + months);

  let updated = 0;

  await prisma.$transaction(
    quizIds.map((quizId) => {
      const amount = priceById.get(quizId) ?? 0;

      return prisma.enrollment.upsert({
        where: { userId_quizId: { userId: user.id, quizId } },
        update: {
          amount: 0,
          status: "paid",
          // no transactionId here by your requirement
          isOffer: true,
          offer: true,
          ai: includeAi,
          billingPeriod: billing as any,
          months,
          paidAt,
          expiresAt,
        },
        create: {
          userId: user.id,
          quizId,
          amount: 0,
          status: "paid",
          isOffer: true,
          offer: true,
          ai: includeAi,
          billingPeriod: billing as any,
          months,
          paidAt,
          expiresAt,
        },
      });
    })
  );

  updated = quizIds.length;
  return { ok: true, updated };
}
