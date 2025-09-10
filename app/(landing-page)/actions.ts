"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { ApiResponse } from "@/lib/types";
import { redirect } from "next/navigation";

const aj = arcjet.withRule(detectBot({ mode: "LIVE", allow: [] })).withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

type Level =
  | "FIRST_YEAR"
  | "SECOND_YEAR"
  | "THIRD_YEAR"
  | "FOURTH_YEAR"
  | "FIFTH_YEAR"
  | "SIXTH_YEAR";

/**
 * Create a single checkout for a bundle of quizzes (an offer).
 * Every quiz in that level gets a PENDING enrollment sharing the same transactionId.
 */
export async function createOfferCheckout(level: Level): Promise<ApiResponse> {
  let checkoutUrl = "";
  const session = await requireUser();
  const userId = session.user.id;

  try {
    // --- Basic bot/rate protection ---
    const req = await request();
    const decision = await aj.protect(req, { fingerprint: userId });
    if (decision.isDenied()) {
      return { status: "error", message: "Request denied" };
    }

    // --- Fetch quizzes for the level ---
    const quizzes = await prisma.quiz.findMany({
      where: { level },
      select: { id: true },
    });

    if (quizzes.length === 0) {
      return { status: "error", message: "No quizzes found for this offer." };
    }

    const quizIds = quizzes.map((q) => q.id);

    // --- Price per level (adjust as you like) ---
    const offerPriceMap: Record<Level, number> = {
      FIRST_YEAR: 299,
      SECOND_YEAR: 249,
      THIRD_YEAR: 249,
      FOURTH_YEAR: 249,
      FIFTH_YEAR: 249,
      SIXTH_YEAR: 249,
    };
    const totalPrice = offerPriceMap[level] ?? 199;

    // --- Create the Chargily checkout for the whole bundle ---
    const payload = {
      amount: totalPrice,
      currency: "dzd",
      success_url: `${env.BETTER_AUTH_URL}/payment/success`,
      // Optional: metadata to identify it's an offer + which quizzes
      // metadata: { type: "OFFER", level, quizIds: JSON.stringify(quizIds) },
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
      return {
        status: "error",
        message: "Failed to create checkout session.",
      };
    }

    checkoutUrl = res.checkout_url;
    const transactionId = String(res.id);

    // --- Pro-rate the price across quizzes to avoid over-counting per enrollment ---
    // If you prefer 0 or the full amount per row, change here.
    const perQuizAmount = Math.round((totalPrice / quizIds.length) * 100) / 100;

    // --- Upsert a PENDING enrollment for each quiz (atomic) ---
    await prisma.$transaction(
      quizIds.map((quizId) =>
        prisma.enrollment.upsert({
          where: { userId_quizId: { userId, quizId } },
          update: {
            amount: perQuizAmount,
            status: "PENDING",
            transactionId,
          },
          create: {
            userId,
            quizId,
            amount: perQuizAmount,
            status: "PENDING",
            transactionId,
            isOffer: true,
          },
        })
      )
    );
  } catch (err) {
    console.error("createOfferCheckout error:", err);
    return { status: "error", message: "Failed to process request" };
  }

  // Send user to payment
  redirect(checkoutUrl);

  return {
    status: "success",
    message: "Checkout created successfully",
  };
}
