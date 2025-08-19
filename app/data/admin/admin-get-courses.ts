import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export const adminGetCourses = async () => {
  await requireAdmin();
  const data = await prisma.course.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      smallDescription: true,
      slug: true,
      status: true,
      price: true,
      fileKey: true,
      level: true,
      category: true,
      duration: true,
      chapters: {
        select: {
          lesson: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
  return data;
};

export type AdminCourseType = Awaited<
  ReturnType<typeof adminGetCourses>
>[number];
