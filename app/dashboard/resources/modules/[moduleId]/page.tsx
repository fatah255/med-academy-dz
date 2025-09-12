// app/modules/[moduleId]/page.tsx
import { prisma } from "@/lib/db";
import SectionHeader from "@/components/section-header";
import { LessonTile } from "@/components/tiles";
import { IconListDetails } from "@tabler/icons-react";
import { getLessonsForModule } from "../../actions";

type Props = { params: Promise<{ moduleId: string }> };

export default async function Page({ params }: Props) {
  const { moduleId } = await params;

  const [mod, lessons] = await Promise.all([
    prisma.modules.findUnique({
      where: { id: moduleId },
      select: { title: true },
    }),
    getLessonsForModule(moduleId),
  ]);

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/40">
      <div className="container mx-auto max-w-6xl py-8 md:py-10">
        <h1 className="text-2xl md:text-3xl font-semibold text-center mb-2">
          {mod?.title ?? "Module"}
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Select a course to view its details
        </p>

        <SectionHeader
          icon={<IconListDetails className="size-5" />}
          title="Courses"
        />

        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No courses yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {lessons.map((l) => (
              <LessonTile
                key={l.id}
                id={l.id}
                title={l.title}
                description={l.description}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
