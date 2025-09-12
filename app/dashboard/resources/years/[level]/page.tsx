// app/years/[level]/page.tsx
import SectionHeader from "@/components/section-header";
import { UniteTile, ModuleTile } from "@/components/tiles";
import { IconFolders, IconBox } from "@tabler/icons-react";
import { getModules, getUnitesForLevel } from "../../actions";
import { levelParamToEnum } from "@/lib/level";

// ⬇️ If your actions live at the path you pasted, import from there instead:
// import { getUnitesForLevel, getModules } from "@/app/whatever/your-path-is";

type Props = { params: Promise<{ level: string }> };

export default async function Page({ params }: Props) {
  const { level } = await params;
  const levelEnum = levelParamToEnum(level);
  const [unites, modules] = await Promise.all([
    getUnitesForLevel(levelEnum),
    getModules(levelEnum),
  ]);

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/40">
      <div className="container mx-auto max-w-6xl py-8 md:py-10">
        {/* Unites */}
        <SectionHeader
          icon={<IconFolders className="size-5" />}
          title="Unites"
          className="mt-2"
        />
        {unites.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-8">
            No unites for this level.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {unites.map((u) => (
              <UniteTile
                key={u.id}
                id={u.id}
                title={u.title}
                description={u.description}
              />
            ))}
          </div>
        )}

        {/* Modules */}
        <SectionHeader icon={<IconBox className="size-5" />} title="Modules" />
        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No modules at this level.
          </p>
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
