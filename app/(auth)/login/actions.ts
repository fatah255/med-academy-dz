import { prisma } from "@/lib/db";

export const handleOneTimeLogin = async (userId: string, sessionId: string) => {
  await prisma.session.deleteMany({
    where: {
      userId,
      id: {
        not: sessionId,
      },
    },
  });
};
