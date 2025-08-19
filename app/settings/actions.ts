"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { requireUser } from "../data/user/require-user";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { ApiResponse } from "@/lib/types";
import { requireAdmin } from "../data/admin/require-admin";

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

export async function editLevel(
  level:
    | "FIRST_YEAR"
    | "SECOND_YEAR"
    | "THIRD_YEAR"
    | "FOURTH_YEAR"
    | "FIFTH_YEAR"
    | "SIXTH_YEAR"
): Promise<ApiResponse> {
  const session = await requireUser();
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
  await prisma.user.update({
    where: { id: session?.user.id },
    data: { level },
  });
  return { status: "success", message: "Level updated successfully" };
}

export async function addAdmin(email: string): Promise<ApiResponse> {
  const session = requireAdmin();
  try {
    await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
    });
    return { status: "success", message: "Admin added successfully" };
  } catch (error) {
    return { status: "error", message: "Failed to add admin" };
  }
}
