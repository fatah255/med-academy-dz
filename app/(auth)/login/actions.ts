import { prisma } from "@/lib/db";
import { isOwnersEmail } from "@/lib/utils";

export const handleOneTimeLogin = async (userId: string, sessionId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { email: true },
  });
  if (isOwnersEmail(user?.email || "")) {
    await prisma.session.deleteMany({
      where: {
        userId,
        id: {
          not: sessionId,
        },
      },
    });
  }
};
