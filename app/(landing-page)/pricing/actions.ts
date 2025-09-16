// app/(marketing)/pricing/actions.ts
"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { redirect } from "next/navigation";

type Billing = "monthly" | "yearly";
type Level =
  | "FIRST_YEAR"
  | "SECOND_YEAR"
  | "THIRD_YEAR"
  | "FOURTH_YEAR"
  | "FIFTH_YEAR"
  | "SIXTH_YEAR";

// 2 months free on yearly => charge 10 months, but access = 12 months
const YEARLY_CHARGE_MONTHS = 10;
const ACCESS_MONTHS_BY_BILLING: Record<Billing, number> = {
  monthly: 1,
  yearly: 12,
};

const aj = arcjet
  .withRule(detectBot({ mode: "LIVE", allow: [] }))
  .withRule(fixedWindow({ mode: "LIVE", window: "1m", max: 5 }));

const YEAR_TO_LEVEL: Record<number, Level> = {
  1: "FIRST_YEAR",
  2: "SECOND_YEAR",
  3: "THIRD_YEAR",
  4: "FOURTH_YEAR",
  5: "FIFTH_YEAR",
  6: "SIXTH_YEAR",
};

function calcBaseMonthly(planId: "without-ai" | "with-ai", yearNum: number) {
  if (planId === "without-ai") return yearNum > 1 ? 99 : 149; // DZD
  return yearNum > 1 ? 149 : 199; // DZD
}
function totalAmount(
  planId: "without-ai" | "with-ai",
  billing: Billing,
  yearNum: number
) {
  const base = calcBaseMonthly(planId, yearNum);
  return billing === "monthly" ? base : base * YEARLY_CHARGE_MONTHS;
}

/** WITHOUT AI (offer) */
export async function createOfferCheckoutAction(formData: FormData) {
  const session = await requireUser();
  const userId = session.user.id;

  const billing = (
    String(formData.get("billing")) === "yearly" ? "yearly" : "monthly"
  ) as Billing;
  const months = ACCESS_MONTHS_BY_BILLING[billing];
  const yearNum = Number(formData.get("year") || 1);
  const level = YEAR_TO_LEVEL[yearNum] || "FIRST_YEAR";

  const req = await request();
  const decision = await aj.protect(req, { fingerprint: userId });
  if (decision.isDenied()) throw new Error("Request denied");

  // quizzes for that level
  const quizzes = await prisma.quiz.findMany({
    where: { level },
    select: { id: true },
  });
  if (!quizzes.length) throw new Error("No quizzes found for this level.");

  const quizIds = quizzes.map((q) => q.id);
  const amount = totalAmount("without-ai", billing, yearNum);

  // Chargily checkout
  const payload = {
    amount,
    currency: "dzd",
    success_url: `${env.BETTER_AUTH_URL}/payment/success`,
    metadata: {
      plan: "without-ai",
      billing,
      level,
      yearNum,
      months, // <- we’ll read this in the webhook if needed
      kind: "offer",
    },
  };

  const res = await fetch("https://pay.chargily.net/api/v2/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CHARGILY_SECRET_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then((r) => r.json());

  if (!res?.checkout_url || !res?.id) {
    console.error("[Chargily] Bad response:", res);
    throw new Error("Failed to create checkout session.");
  }

  const checkoutUrl = String(res.checkout_url);
  const transactionId = String(res.id);

  const perQuizAmount = Math.round((amount / quizIds.length) * 100) / 100;

  // Write plan info into pending rows
  await prisma.$transaction(
    quizIds.map((quizId) =>
      prisma.enrollment.upsert({
        where: { userId_quizId: { userId, quizId } },
        update: {
          amount: perQuizAmount,
          status: "PENDING",
          transactionId,
          isOffer: true,
          offer: true,
          ai: false,
          billingPeriod: billing.toUpperCase() as any, // MONTHLY | YEARLY
          months, // 1 or 12
          paidAt: null,
          expiresAt: null,
        },
        create: {
          userId,
          quizId,
          amount: perQuizAmount,
          status: "PENDING",
          transactionId,
          isOffer: true,
          offer: true,
          ai: false,
          billingPeriod: billing.toUpperCase() as any,
          months,
          paidAt: null,
          expiresAt: null,
        },
      })
    )
  );

  redirect(checkoutUrl);
}

/** WITH AI (same quizzes + AI flags) */
export async function createAICheckoutAction(formData: FormData) {
  const session = await requireUser();
  const userId = session.user.id;

  const billing = (
    String(formData.get("billing")) === "yearly" ? "yearly" : "monthly"
  ) as Billing;
  const months = ACCESS_MONTHS_BY_BILLING[billing];
  const yearNum = Number(formData.get("year") || 1);
  const level = YEAR_TO_LEVEL[yearNum] || "FIRST_YEAR";

  const req = await request();
  const decision = await aj.protect(req, { fingerprint: userId });
  if (decision.isDenied()) throw new Error("Request denied");

  // quizzes for that level
  const quizzes = await prisma.quiz.findMany({
    where: { level },
    select: { id: true },
  });
  if (!quizzes.length) throw new Error("No quizzes found for this level.");

  const quizIds = quizzes.map((q) => q.id);
  const amount = totalAmount("with-ai", billing, yearNum);

  const payload = {
    amount,
    currency: "dzd",
    success_url: `${env.BETTER_AUTH_URL}/payment/success`,
    metadata: {
      plan: "with-ai",
      billing,
      level,
      yearNum,
      months,
      kind: "offer+ai",
    },
  };

  const res = await fetch("https://pay.chargily.net/api/v2/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CHARGILY_SECRET_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then((r) => r.json());

  if (!res?.checkout_url || !res?.id) {
    console.error("[Chargily] Bad response:", res);
    throw new Error("Failed to create checkout session.");
  }

  const checkoutUrl = String(res.checkout_url);
  const transactionId = String(res.id);

  const perQuizAmount = Math.round((amount / quizIds.length) * 100) / 100;

  await prisma.$transaction(
    quizIds.map((quizId) =>
      prisma.enrollment.upsert({
        where: { userId_quizId: { userId, quizId } },
        update: {
          amount: perQuizAmount,
          status: "PENDING",
          transactionId,
          isOffer: true,
          offer: true,
          ai: true, // <- key difference
          billingPeriod: billing.toUpperCase() as any,
          months,
          paidAt: null,
          expiresAt: null,
        },
        create: {
          userId,
          quizId,
          amount: perQuizAmount,
          status: "PENDING",
          transactionId,
          isOffer: true,
          offer: true,
          ai: true, // <- key difference
          billingPeriod: billing.toUpperCase() as any,
          months,
          paidAt: null,
          expiresAt: null,
        },
      })
    )
  );

  redirect(checkoutUrl);
}
