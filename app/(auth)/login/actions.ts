import { prisma } from "@/lib/db";

export const handleOneTimeLogin = async (userId: string, sessionId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { email: true },
  });
  if (
    user?.email !== "a.lebkara@esi-sba.dz" &&
    user?.email !== "medacademydz@gmail.com"
  ) {
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
