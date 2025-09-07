// app/dashboard/notes/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";

export async function createNote() {
  const session = await requireUser();
  const userId = session.user.id;
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
