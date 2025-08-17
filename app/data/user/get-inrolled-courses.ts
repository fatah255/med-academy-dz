import "server-only";
import { requireUser } from "./require-user";
import { prisma } from "@/lib/db";

export async function getInrolledCourses() {
  const user = await requireUser();

  const data = await prisma.enrollment.findMany({
    where: {
      userId: user.user.id,
      status: {
        in: ["PAID", "paid"],
      },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          smallDescription: true,
          fileKey: true,
          slug: true,
          level: true,
          category: true,
          duration: true,
          chapters: {
            select: {
              id: true,
              lesson: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return data;
}
