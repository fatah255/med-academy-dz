import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";

// GET /api/qcm/set/:setId
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ setId: string }> }
) {
  await requireUser(); // auth gate (ownership enforced at create time)
  const { setId } = await params;

  const set = await prisma.chatQcmSet.findUnique({
    where: { id: setId },
    select: {
      id: true,
      createdAt: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          question: true,
          choices: true, // TEXT[] in CockroachDB
          correctIndex: true,
          explanation: true,
        },
      },
    },
  });

  if (!set) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    id: set.id,
    createdAt: set.createdAt.toISOString(),
    questions: set.items.map((i) => ({
      id: i.id,
      question: i.question,
      choices: i.choices, // string[]
      correctIndex: i.correctIndex, // number
      explanation: i.explanation ?? undefined,
    })),
  });
}
