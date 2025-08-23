import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";
import { notFound } from "next/navigation";

export const getLesson = async (lessonId: string) => {
  await requireAdmin();
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        thumbnailKey: true,
        videoKey: true,
        description: true,
        position: true,
      },
    });

    if (!lesson) {
      return notFound();
    }

    return lesson;
  } catch {
    return notFound();
  }
};

export type AdminLessonType = Awaited<ReturnType<typeof getLesson>>;
