import { getLevel } from "@/app/(landing-page)/courses/actions";
import { requireUser } from "@/app/data/user/require-user";

import DriveGrid from "@/components/drive/DriveGrid";
import { modulesByYear } from "@/lib/utils";

const YEAR_LABEL: Record<string, string> = {
  FIRST_YEAR: "1ère année",
  SECOND_YEAR: "2ème année",
  THIRD_YEAR: "3ème année",
  FOURTH_YEAR: "4ème année",
  FIFTH_YEAR: "5ème année",
  SIXTH_YEAR: "6ème année",
};

export default async function DrivesPage() {
  const session = await requireUser();
  const userId = session.user.id;

  const level = await getLevel(userId); // e.g. "FIRST_YEAR" | ...
  const block = modulesByYear.find((b) => b.year === level);

  const items = (block?.modules ?? []).map((m) => ({
    name: m.name,
    type: m.type,
    icon: m.icon ?? "",
    link: (m.link ?? "").trim(),
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Google Drive — {YEAR_LABEL[level] ?? level}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accédez rapidement aux modules et unités de votre année.
          </p>
        </div>
      </div>
      {/* @ts-ignore */}
      <DriveGrid items={items} />
    </div>
  );
}
