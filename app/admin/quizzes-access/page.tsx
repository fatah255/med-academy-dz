// app/admin/quizzes-access/page.tsx
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import QuizzesAccessForm from "@/components/admin/QuizzesAccessForm";
import { isOwnersEmail } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireAdmin();
  if (!isOwnersEmail(session.user.email)) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p className="text-sm text-muted-foreground">Owners only.</p>
      </div>
    );
  }

  const quizzes = await prisma.quiz.findMany({
    orderBy: [{ level: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      level: true, // CourseLevel enum
      category: true,
      status: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Quizzes Access</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Grant quiz access to a user. Filter by year, pick billing period, and
        optionally include AI access.
      </p>
      <QuizzesAccessForm quizzes={quizzes} />
    </div>
  );
}
