import { prisma } from "@/lib/db";

export const getAllCourses = async () => {
  const data = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      smallDescription: true,
      duration: true,
      level: true,
      category: true,
      fileKey: true,
      slug: true,
      price: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
};

export type PublicCoursesType = Awaited<ReturnType<typeof getAllCourses>>;
export type PublicCourseType = PublicCoursesType[number];
