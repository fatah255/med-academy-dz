import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function userIsEnrolled(courseId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return false;
  }

  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    select: {
      price: true,
    },
  });

  if (course?.price === 0) {
    return true;
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
    select: {
      status: true,
    },
  });

  return enrollment
    ? enrollment.status === "PAID" || enrollment.status === "paid"
    : false;
}
