// app/ngl/actions.ts
"use server";

import { prisma } from "@/lib/db";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import crypto from "node:crypto";

const aj = arcjet
  .withRule(detectBot({ mode: "LIVE", allow: [] }))
  .withRule(fixedWindow({ mode: "LIVE", window: "1m", max: 6 }));

function strip(input: string, max = 500) {
  const s = input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return s.slice(0, max);
}

function ipHash(ip?: string | null) {
  if (!ip) return null;
  const salt = process.env.NGL_IP_SALT ?? "salt";
  return crypto
    .createHash("sha256")
    .update(ip + salt)
    .digest("hex");
}

/** Public: create a message for recipient identified by share code */
// export async function createNglMessageByCode(code: string, raw: string) {
//   const req = await request();
//   const decision = await aj.protect(req, { fingerprint: code });
//   if (decision.isDenied()) {
//     return { status: "error", message: "Please slow down." };
//   }

//   const content = strip(raw);
//   if (!content) return { status: "error", message: "Message is empty." };

//   const link = await prisma.nglLink.findUnique({
//     where: { code },
//     select: { active: true, recipientId: true },
//   });
//   if (!link || !link.active) {
//     return { status: "error", message: "This inbox is not active." };
//   }
//   const headers = req.headers as Headers;
//   const ip = req.ip ?? headers.get("x-forwarded-for") ?? undefined;

//   await prisma.nglMessage.create({
//     data: {
//       recipientId: link.recipientId,
//       content,
//       ipHash: ipHash(typeof ip === "string" ? ip : undefined),
//       userAgent: headers.get("user-agent") ?? undefined,
//     },
//   });

//   return { status: "success", message: "Message sent ✨" };
// }

/** Private (for the owner): ensure (or create) my share code */
import { requireUser } from "@/app/data/user/require-user";
import { randomBytes } from "node:crypto";

function makeCode() {
  // short, URL-safe code
  return randomBytes(4).toString("hex"); // e.g. "a3f91b2c"
}

export async function ensureMyNglLink() {
  const session = await requireUser();
  const current = await prisma.nglLink.findUnique({
    where: { recipientId: "j9fF3J5E6MpcXJ85acmfUDk8jRV8q4xe" },
  });
  if (current) return current.code;

  const code = makeCode();
  await prisma.nglLink.create({
    data: { code, recipientId: session.user.id, active: true },
  });
  return code;
}

/** Private: list my messages (read-only) */
export async function listMyNglMessages() {
  const session = await requireUser();
  return prisma.nglMessage.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, content: true, createdAt: true, fileKey: true },
  });
}

type NglPayload = {
  content: string;
  fileKey?: string | undefined;
};

export async function createNglMessageByCode(code: string, data: NglPayload) {
  const req = await request();
  const decision = await aj.protect(req, { fingerprint: code });
  if (decision.isDenied()) {
    return { status: "error", message: "Please slow down." };
  }

  const content = strip(data.content);
  if (!content) return { status: "error", message: "Message is empty." };

  const link = await prisma.nglLink.findUnique({
    where: { code },
    select: { active: true, recipientId: true },
  });
  if (!link?.active) {
    return { status: "error", message: "This inbox is not active." };
  }

  // Headers: make TS happy & be defensive
  const headers: Headers = (req as any).headers ?? new Headers();
  const getH = (n: string) => headers.get(n) ?? undefined;

  const xff = getH("x-forwarded-for");
  const ip =
    (typeof (req as any).ip === "string" && (req as any).ip) ||
    (xff ? xff.split(",")[0].trim() : undefined) ||
    getH("x-real-ip") ||
    getH("cf-connecting-ip") ||
    undefined;

  const ua = getH("user-agent");

  await prisma.nglMessage.create({
    data: {
      recipientId: link.recipientId,
      content,
      fileKey: data.fileKey ?? undefined, // <-- store the optional image key
      ipHash: ipHash(ip),
      userAgent: ua,
    },
  });

  return { status: "success", message: "Message sent ✨" };
}
