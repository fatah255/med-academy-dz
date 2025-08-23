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

export async function createCheckout(courseId: string): Promise<ApiResponse> {
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
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true },
    });
    const price = course?.price || 0;

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

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      await prisma.enrollment.create({
        data: {
          userId,
          courseId,
          amount: price,
          status: "PENDING",
          transactionId: res.id,
        },
      });
    } else {
      await prisma.enrollment.update({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        data: {
          amount: price,
          status: "PENDING",
          transactionId: res.id,
        },
      });
    }
  } catch {
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
