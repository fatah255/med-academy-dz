// app/admin/course-access/page.tsx
import { prisma } from "@/lib/db";
import CourseAccessForm from "@/components/admin/CourseAccessForm";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { isOwnersEmail } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireAdmin();
  if (!isOwnersEmail(session.user.email)) {
    // Keep it simple; you can redirect/throw if you prefer
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p className="text-sm text-muted-foreground">Owners only.</p>
      </div>
    );
  }
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED", price: { gt: 0 } },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      level: true,
      status: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Course Access</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Grant or update course access for a user by email.
      </p>

      <CourseAccessForm courses={courses} />
    </div>
  );
}
