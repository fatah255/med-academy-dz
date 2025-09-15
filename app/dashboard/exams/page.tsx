import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { modulesByYear } from "@/lib/utils";
import { requireUser } from "@/app/data/user/require-user";
import { notFound } from "next/navigation";
import ExamsLocked from "./_components/exam-locked";
import { Prisma } from "@prisma/client";

/* ---------- Helpers ---------- */

type SP = Record<string, string | string[] | undefined>;

/** Build a string href safely (prevents the RSC “non-serializable” error) */
function buildHref(basePath: string, sp: SP, nextPage: number) {
  const qs = new URLSearchParams();

  for (const [k, v] of Object.entries(sp)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      for (const x of v) qs.append(k, x);
    } else {
      qs.set(k, v);
    }
  }
  qs.set("page", String(nextPage)); // override/add page
  const q = qs.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await requireUser();
  const resolvedSP = await searchParams;

  // ——————————————————————————————————————————————
  // Resolve user's accessible level from their paid offer
  // ——————————————————————————————————————————————
  const levelOffer = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      OR: [{ isOffer: true }, { offer: true }],
      status: { in: ["PAID", "paid"] },
    },
    select: { quiz: { select: { level: true } } },
  });
  if (!levelOffer) {
    return <ExamsLocked />;
  }
  const level = levelOffer?.quiz?.level; // "FIRST_YEAR" | "SECOND_YEAR" | ...

  // Available categories for THIS level (from modulesByYear)
  const levelGroup = modulesByYear.find((g) => g.year === level);
  const availableCategories = levelGroup?.modules.map((m) => m.name) ?? [];

  // ——————————————————————————————————————————————
  // Parse incoming query params (GET)
  // ——————————————————————————————————————————————
  const q = (typeof resolvedSP.q === "string" ? resolvedSP.q : "") ?? "";
  const year = Number(
    typeof resolvedSP.year === "string" ? resolvedSP.year : 0
  );
  const sortKey =
    typeof resolvedSP.sort === "string" ? resolvedSP.sort : "title"; // "title" | "createdAt"
  const catRaw = typeof resolvedSP.cat === "string" ? resolvedSP.cat : "";
  // Only accept category if it belongs to the current level
  const cat = availableCategories.includes(catRaw) ? catRaw : "";

  const page = Math.max(
    1,
    Number(typeof resolvedSP.page === "string" ? resolvedSP.page : 1)
  );
  const perPage = 20;

  // ——————————————————————————————————————————————
  // Build Prisma where/orderBy
  // ——————————————————————————————————————————————
  const where: Prisma.examsWhereInput = {
    ...(level && { level }), // restrict to user's level if present
    ...(q && { title: { contains: q, mode: "insensitive" } }),
    ...(year ? { year } : {}),
    ...(cat ? { category: cat } : {}),
  };

  const orderBy: Prisma.examsOrderByWithRelationInput =
    sortKey === "createdAt" ? { createdAt: "desc" } : { title: "asc" };

  // ——————————————————————————————————————————————
  // Fetch data & counts
  // ——————————————————————————————————————————————
  const [items, total, years] = await Promise.all([
    prisma.exams.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        title: true,
        year: true,
        category: true,
        createdAt: true,
      },
    }),
    prisma.exams.count({ where }),
    prisma.exams.findMany({
      where: level ? { level } : {},
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  // Pagination hrefs (must be strings)
  const basePath = "/dashboard/exams";
  const prevHref = buildHref(basePath, resolvedSP, page - 1);
  const nextHref = buildHref(basePath, resolvedSP, page + 1);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
      {/* Heading */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Exams</h1>

        {/* GET form (server-safe) */}
        <form
          className="flex items-center gap-2"
          action={basePath}
          method="get"
        >
          {/* Search */}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search exams…"
            className="h-9 w-56 rounded-md border bg-background px-3 text-sm"
          />

          {/* Year */}
          <select
            name="year"
            defaultValue={year || ""}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y.year} value={y.year}>
                {y.year}
              </option>
            ))}
          </select>

          {/* Category (from level’s modules) */}
          <select
            name="cat"
            defaultValue={cat || ""}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            disabled={availableCategories.length === 0}
          >
            <option value="">
              {availableCategories.length ? "All categories" : "No categories"}
            </option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            name="sort"
            defaultValue={sortKey}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="title">Title (A–Z)</option>
            <option value="createdAt">Newest</option>
          </select>

          <Button type="submit" variant="primary" size="md">
            Apply
          </Button>
        </form>
      </div>

      {/* Results */}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No exams found. Try adjusting your search/filters.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((e) => (
            <li key={e.id}>
              <Link
                className="text-base font-medium hover:underline"
                href={`/dashboard/exams/${e.id}`}
              >
                {e.title}
              </Link>
              <span className="ml-2 text-xs text-muted-foreground">
                {e.year} • {e.category}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button asChild variant="outline" size="sm" disabled={page <= 1}>
            <Link href={prevHref}>Previous</Link>
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} / {pageCount}
          </span>
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
          >
            <Link href={nextHref}>Next</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

// simple card to show exams
function ExamCard({
  exam,
}: {
  exam: {
    id: string;
    title: string;
    year: number;
    level: string;
    category: string;
  };
}) {
  return (
    <div className="rounded-lg border p-4 hover:shadow-sm transition">
      <div className="text-sm text-muted-foreground">
        {exam.category} • Y{exam.year}
      </div>
      <h3 className="mt-1 font-medium">
        <Link href={`/dashboard/exams/${exam.id}`} className="hover:underline">
          {exam.title}
        </Link>
      </h3>
    </div>
  );
}
