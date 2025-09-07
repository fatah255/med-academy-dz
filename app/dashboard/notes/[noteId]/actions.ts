// app/dashboard/notes/[noteId]/actions.ts
"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { notFound } from "next/navigation";

/** Load the current snapshot JSON string for this note (or null). */
export async function loadNoteSnapshot(noteId: string): Promise<string | null> {
  const session = await requireUser();
  const userId = session.user.id;

  const note = await prisma.notes.findFirst({
    where: { id: noteId, userId },
    select: { content: true },
  });

  return note?.content ?? null;
}

/** Save a new snapshot JSON string for this note. */
export async function saveNoteSnapshot(
  noteId: string,
  snapshotJson: string
): Promise<{ ok: true }> {
  const session = await requireUser();
  const userId = session.user.id;

  // Authorization + update in one go
  const res = await prisma.notes.updateMany({
    where: { id: noteId, userId },
    data: { content: snapshotJson },
  });

  if (res.count === 0) {
    throw new Error("Note not found or you don't own it.");
  }
  return { ok: true };
}
