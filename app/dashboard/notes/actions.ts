// app/dashboard/notes/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { getLevel } from "@/app/(landing-page)/courses/actions";
import { request } from "@arcjet/next";

export async function createNote() {
  const session = await requireUser();
  const userId = session.user.id;
  let window = "1440m";

  const level = await getLevel(userId);
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, quiz: { level }, status: { in: ["paid", "PAID"] } },
    select: { id: true },
  });

  if (enrollment?.id) {
    window = "1m";
  }

  const aj = arcjet
    .withRule(detectBot({ mode: "LIVE", allow: [] }))
    .withRule(fixedWindow({ mode: "LIVE", window, max: 3 }));
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: session.user.id || "anon",
  });
  if (decision.isDenied()) {
    throw new Error(
      "You can only create 3 notes per Day , upgrade for unlimited notes"
    );
  }

  const num = Math.floor(Math.random() * 12);
  const note = await prisma.notes.create({
    data: {
      userId,
      title: "Untitled",
      content: null, // or "{}" if you prefer JSON string
      imageNumber: num,
    },
    select: { id: true },
  });

  // return a simple value to client components
  return note; // { id: string }
}

/** Rename a note the current user owns */
export async function renameNote(noteId: string, title: string) {
  const session = await requireUser();
  const userId = session.user.id;

  if (!title.trim()) {
    return { ok: false as const, error: "Empty title" };
  }

  // Ensure the note belongs to the user
  const note = await prisma.notes.update({
    where: { userId_id: { id: noteId, userId } }, // composite unique or use AND filter
    data: { title: title.trim() },
    select: { id: true, title: true },
  });

  // Revalidate the notes list page (and/or wherever you render titles)
  revalidatePath("/dashboard/notes");
  return { ok: true as const, note };
}

/** Delete a note the current user owns */
export async function deleteNote(noteId: string) {
  const { user } = await requireUser();
  const res = await prisma.notes.deleteMany({
    where: { id: noteId, userId: user.id },
  });
  if (res.count === 0) throw new Error("Not found or unauthorized");
  revalidatePath("/dashboard/notes");
  return { ok: true };
}
