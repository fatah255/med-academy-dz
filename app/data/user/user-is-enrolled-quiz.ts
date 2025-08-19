import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function userIsEnrolledQuiz(quizId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return false;
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_quizId: {
        userId: session.user.id,
        quizId,
      },
    },
    select: {
      status: true,
    },
  });

  return session.user.role === "admin"
    ? true
    : enrollment
    ? enrollment.status === "PAID" || enrollment.status === "paid"
    : false;
}
