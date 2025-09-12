// app/units/[unitId]/page.tsx
import { prisma } from "@/lib/db";
import { ModuleTile } from "@/components/tiles";
import { IconBox } from "@tabler/icons-react";
import { getModulesForUnit } from "../../actions";
import SectionHeader from "@/components/section-header";

type Props = { params: Promise<{ unitId: string }> };

export default async function Page({ params }: Props) {
  const { unitId } = await params;
  const [unit, modules] = await Promise.all([
    prisma.unites.findUnique({
      where: { id: unitId },
      select: { title: true },
    }),
    getModulesForUnit(unitId),
  ]);

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/40">
      <div className="container mx-auto max-w-6xl py-8 md:py-10">
        <h1 className="text-2xl md:text-3xl font-semibold text-center mb-2">
          {unit?.title ?? "Unit"}
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Select a module to view its courses
        </p>

        <SectionHeader icon={<IconBox className="size-5" />} title="Modules" />
        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No modules found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {modules.map((m) => (
              <ModuleTile
                key={m.id}
                id={m.id}
                title={m.title}
                description={m.description}
                iconEmoji={m.icon}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
