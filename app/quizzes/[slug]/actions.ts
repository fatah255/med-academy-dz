"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { ApiResponse } from "@/lib/types";
import { redirect } from "next/navigation";

const aj = arcjet
  .withRule(
    detectBot({
      mode: "LIVE",
      allow: [],
    })
  )
  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 5,
    })
  );

export async function createQuizCheckout(quizId: string): Promise<ApiResponse> {
  let checkoutUrl: string;
  const session = await requireUser();
  const userId = session?.user?.id;

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session?.user.id || "",
    });
    if (decision.isDenied()) {
      return {
        status: "error",
        message: "Request denied",
      };
    }
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { price: true },
    });
    const price = quiz?.price || 0;

    const payload = {
      amount: price,
      currency: "dzd",
      success_url: `${env.BETTER_AUTH_URL}/payment/success`,
    };

    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHARGILY_SECRET_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };

    const res = await fetch(
      "https://pay.chargily.net/test/api/v2/checkouts",
      options
    ).then((response) => response.json());

    checkoutUrl = res.checkout_url;
    console.log(res);

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_quizId: {
          userId,
          quizId,
        },
      },
    });

    if (!enrollment) {
      await prisma.enrollment.create({
        data: {
          userId,
          quizId,
          amount: price,
          status: "PENDING",
          transactionId: res.id,
        },
      });
    } else if (enrollment.status === "PENDING") {
      await prisma.enrollment.upsert({
        where: { userId_quizId: { userId, quizId } },
        update: {
          amount: price,
          transactionId: String(res.id), // <- always set/refresh
        },
        create: {
          user: { connect: { id: userId } },
          quiz: { connect: { id: quizId } },
          amount: price,
          status: "PENDING",
          transactionId: String(res.id), // <- always set/refresh
        },
      });
    }
  } catch (error) {
    return {
      status: "error",
      message: "Failed to process request",
    };
  }

  redirect(checkoutUrl);

  return {
    status: "success",
    message: "Checkout created successfully",
  };
}
