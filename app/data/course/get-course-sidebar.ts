import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getCourseSidebar(slug: string) {
  const session = await requireUser();
  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      smallDescription: true,
      fileKey: true,
      level: true,
      category: true,
      duration: true,
      chapters: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          title: true,
          position: true,
          lesson: {
            select: {
              id: true,
              title: true,
              position: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    return notFound();
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: course?.id,
      },
      status: {
        in: ["PAID", "paid"],
      },
    },
  });

  if (!enrollment) {
    return notFound();
  }

  return {
    course,
  };
}

export type CourseSidebarType = Awaited<ReturnType<typeof getCourseSidebar>>;
