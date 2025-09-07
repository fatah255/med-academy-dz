import TldrawClient from "./_components/TldrawClient";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
export default async function Page({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;
  const session = await requireUser();

  const note = await prisma.notes.findFirst({
    where: { id: noteId, userId: session.user.id },
    select: { id: true },
  });
  // if (!note) notFound(); // ✅ this will render the 404 page

  return <TldrawClient noteId={noteId} />;
}
