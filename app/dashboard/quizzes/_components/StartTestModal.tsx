// StartTestModal.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, AlertIcon, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useDirection } from "@radix-ui/react-direction";
import { toast } from "sonner";
import { RiCheckboxCircleFill } from "@remixicon/react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type CoursOption = { id: string; title: string; questionCount?: number | null };
type ModuleGroup = { id: string; title: string; cours: CoursOption[] };

type StartInfoPayload = {
  coursOptions: CoursOption[];
  yearIndex: Record<string, Record<number, number>>;
  globalMinYear: number | null;
  globalMaxYear: number | null;
  totalQuestions: number;
  isUnite: boolean;
  moduleGroups?: ModuleGroup[];
};

/* ------------------ Cache helpers ------------------ */
const CACHE_VERSION = "v2";
const CACHE_TTL_MS = 1000 * 60 * 15;
const cacheKey = (quizId: string) =>
  `quiz:start-info:${CACHE_VERSION}:${quizId}`;
type CacheEnvelope = { ts: number; data: StartInfoPayload };

function readCache(quizId: string): CacheEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(quizId));
    return raw ? (JSON.parse(raw) as CacheEnvelope) : null;
  } catch {
    return null;
  }
}
function writeCache(quizId: string, data: StartInfoPayload) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      cacheKey(quizId),
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {}
}
const isFresh = (env: CacheEnvelope | null) =>
  !!env && Date.now() - env.ts < CACHE_TTL_MS;

/* =================================================== */

export default function StartTest({ quizId }: { quizId: string }) {
  const [open, setOpen] = useState(false);
  const [fetched, setFetched] = useState<StartInfoPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const direction = useDirection();

  /* --------------- Lazy load with cache --------------- */
  useEffect(() => {
    if (!open) return;
    if (fetched || loading || refreshing) return;

    const cached = readCache(quizId);

    const fetchFresh = () =>
      fetch(`/api/quiz/start-info?quizId=${encodeURIComponent(quizId)}`)
        .then(async (r) => {
          if (!r.ok) throw new Error(await r.text());
          return (await r.json()) as StartInfoPayload;
        })
        .then((data) => {
          writeCache(quizId, data);
          setFetched(data);
        })
        .catch((e) => setErr(e.message || "Failed to load"));

    if (cached && isFresh(cached)) {
      setFetched(cached.data);
      return;
    }

    if (cached && !isFresh(cached)) {
      setFetched(cached.data);
      setRefreshing(true);
      fetchFresh().finally(() => setRefreshing(false));
      return;
    }

    setLoading(true);
    fetchFresh().finally(() => setLoading(false));
  }, [open, fetched, loading, refreshing, quizId]);

  /* --------------- Pluck data --------------- */
  const coursOptions = fetched?.coursOptions ?? [];
  const moduleGroups = fetched?.moduleGroups ?? [];
  const isUnite = !!fetched?.isUnite && moduleGroups.length > 0;

  const yearIndex = fetched?.yearIndex ?? {};
  const globalMinYear =
    typeof fetched?.globalMinYear === "number"
      ? fetched!.globalMinYear
      : undefined;
  const globalMaxYear =
    typeof fetched?.globalMaxYear === "number"
      ? fetched!.globalMaxYear
      : undefined;
  const hasYearData =
    typeof globalMinYear === "number" && typeof globalMaxYear === "number";

  /* --------------- Form schema --------------- */
  const FormSchema = z
    .object({
      numberOfQuestions: z
        .number()
        .int("Must be an integer")
        .min(0, "Number of questions cannot be negative"),
      coursIds: z.array(z.string()).min(1, "Select at least one cours"),
      yearFrom: z.number().optional(),
      yearTo: z.number().optional(),
    })
    .refine(
      (val) => {
        if (!hasYearData) return true;
        if (val.yearFrom == null && val.yearTo == null) return true;
        if (val.yearFrom == null || val.yearTo == null) return false;
        return val.yearFrom <= val.yearTo;
      },
      { message: "Invalid year range", path: ["yearTo"] }
    );
  type FormValues = z.infer<typeof FormSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      numberOfQuestions: 0,
      coursIds: [],
      yearFrom: undefined,
      yearTo: undefined,
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!fetched) return;
    const allCoursIds = (
      isUnite
        ? moduleGroups.flatMap((g) => g.cours.map((c) => c.id))
        : coursOptions.map((c) => c.id)
    ).filter(Boolean);

    form.reset({
      numberOfQuestions: fetched.totalQuestions,
      coursIds: allCoursIds,
      yearFrom:
        typeof fetched.globalMinYear === "number"
          ? fetched.globalMinYear
          : undefined,
      yearTo:
        typeof fetched.globalMaxYear === "number"
          ? fetched.globalMaxYear
          : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetched]);

  const watchedCoursIds =
    useWatch({ control: form.control, name: "coursIds" }) ?? [];
  const yearFrom = useWatch({ control: form.control, name: "yearFrom" });
  const yearTo = useWatch({ control: form.control, name: "yearTo" });

  const allIds = useMemo(
    () =>
      (isUnite
        ? moduleGroups.flatMap((g) => g.cours.map((c) => c.id))
        : coursOptions.map((c) => c.id)
      ).filter(Boolean),
    [isUnite, moduleGroups, coursOptions]
  );

  const allSelected =
    allIds.length > 0 && watchedCoursIds.length === allIds.length;
  const someSelected = watchedCoursIds.length > 0 && !allSelected;

  const dynamicCap = useMemo(() => {
    if (!watchedCoursIds.length || !fetched) return 0;

    const anyYearData = watchedCoursIds.some(
      (cid) => Object.keys(yearIndex[cid] ?? {}).length
    );

    if (!anyYearData) {
      const pool = isUnite
        ? moduleGroups.flatMap((g) => g.cours)
        : coursOptions;
      return pool
        .filter((c) => watchedCoursIds.includes(c.id))
        .reduce((acc, c) => acc + (c.questionCount ?? 0), 0);
    }

    const from =
      typeof yearFrom === "number" ? yearFrom : (globalMinYear as number);
    const to = typeof yearTo === "number" ? yearTo : (globalMaxYear as number);

    let sum = 0;
    for (const cid of watchedCoursIds) {
      const perYear = yearIndex[cid] ?? {};
      for (const [yStr, cnt] of Object.entries(perYear)) {
        const y = Number(yStr);
        if (y >= from && y <= to) sum += cnt;
      }
    }
    return sum;
  }, [
    watchedCoursIds,
    coursOptions,
    moduleGroups,
    isUnite,
    yearIndex,
    yearFrom,
    yearTo,
    globalMinYear,
    globalMaxYear,
    fetched,
  ]);

  useEffect(() => {
    if (!fetched) return;
    form.setValue("numberOfQuestions", dynamicCap, { shouldValidate: true });
  }, [dynamicCap, fetched, form]);

  function onSubmit(values: FormValues) {
    const qty = Math.max(
      0,
      Math.min(values.numberOfQuestions ?? 0, dynamicCap)
    );
    const coursParam = (values.coursIds ?? []).join(",");
    const params = new URLSearchParams({
      ques: String(qty),
      cours: coursParam,
    });
    if (hasYearData && values.yearFrom != null && values.yearTo != null) {
      params.set("yearFrom", String(values.yearFrom));
      params.set("yearTo", String(values.yearTo));
    }

    toast.custom((t) => (
      <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
        <AlertIcon>
          <RiCheckboxCircleFill />
        </AlertIcon>
        <AlertTitle>You will be redirected into the test</AlertTitle>
      </Alert>
    ));

    setSubmitting(true);
    router.push(`/dashboard/quizzes/${quizId}?${params.toString()}`);
    setOpen(false);
    form.reset();
    setSubmitting(false);
  }

  const handleSelectAll = () =>
    form.setValue("coursIds", allIds, {
      shouldValidate: true,
      shouldDirty: true,
    });
  const handleClearAll = () =>
    form.setValue("coursIds", [], { shouldValidate: true, shouldDirty: true });
  const handleToggleMaster = (v: boolean | "indeterminate") =>
    form.setValue("coursIds", v === true ? allIds : [], {
      shouldValidate: true,
      shouldDirty: true,
    });

  const toggleCours = (id: string, on: boolean) => {
    const prev = form.getValues("coursIds") ?? [];
    if (on) {
      if (!prev.includes(id))
        form.setValue("coursIds", [...prev, id], {
          shouldValidate: true,
          shouldDirty: true,
        });
    } else {
      form.setValue(
        "coursIds",
        prev.filter((x) => x !== id),
        { shouldValidate: true, shouldDirty: true }
      );
    }
  };

  const toggleModule = (group: ModuleGroup, on: boolean) => {
    const ids = group.cours.map((c) => c.id);
    const prev = new Set(form.getValues("coursIds") ?? []);
    if (on) {
      ids.forEach((id) => prev.add(id));
    } else {
      ids.forEach((id) => prev.delete(id));
    }
    form.setValue("coursIds", Array.from(prev), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const disabledUI = !fetched || loading;
  const isLoadingUI = (loading && !fetched) || (!fetched && !err);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-4 w-full">Start a test</Button>
      </DialogTrigger>

      <DialogContent
        // WIDTH + OUTER BOX: constrain width and height, remove padding, and avoid overflow issues
        className="
          p-0 overflow-hidden rounded-xl md:rounded-2xl
          w-[min(100vw-1rem,40rem)] sm:max-w-lg
          max-h-[100dvh] sm:max-h-[85vh]
        "
        dir={direction}
      >
        {/* FLEX COLUMN WRAPPER: allow inner sections to shrink/scroll */}
        <div
          className="
            flex flex-col min-h-0
            /* MOBILE height cap with dvh (and fallback below) */
            h-[calc(100dvh-0.5rem)]
            sm:h-auto
            bg-background
          "
          // Fallback for browsers w/o dvh support (Safari older)
          style={{ maxHeight: "calc(100vh - 0.5rem)" }}
        >
          {(loading || refreshing) && (
            <div className="px-4 pt-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {loading ? "Loading options…" : "Refreshing options…"}
              </span>
            </div>
          )}
          {err && (
            <p className="px-4 pt-2 text-sm text-destructive">
              Failed to load quiz details: {err}
            </p>
          )}

          {/* HEADER: sticky, safe-area aware */}
          <DialogHeader
            className="
              sticky top-0 z-10
              bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
              border-b px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-3
            "
          >
            <DialogTitle>Start Test</DialogTitle>
            <DialogDescription>
              Choose the number of questions,{" "}
              {isUnite ? "modules/cours" : "courses"}, and (optionally) a year
              range.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              className="contents"
            >
              {/* BODY: scrollable area between sticky header/footer */}
              <DialogBody className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
                {isLoadingUI ? (
                  <LoadingCoursSkeleton />
                ) : (
                  <>
                    {/* Year Range */}
                    {hasYearData && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="yearFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>From (year)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min={globalMinYear}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? undefined
                                        : Number(e.target.value)
                                    )
                                  }
                                  disabled={disabledUI}
                                />
                              </FormControl>
                              <FormDescription>
                                Available: {globalMinYear}–{globalMaxYear}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="yearTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>To (year)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  max={globalMaxYear}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? undefined
                                        : Number(e.target.value)
                                    )
                                  }
                                  disabled={disabledUI}
                                />
                              </FormControl>
                              <FormDescription>
                                Leave empty = all years
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              if (!hasYearData) return;
                              form.setValue("yearFrom", globalMinYear, {
                                shouldValidate: true,
                              });
                              form.setValue("yearTo", globalMaxYear, {
                                shouldValidate: true,
                              });
                            }}
                            disabled={disabledUI}
                          >
                            All years
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              form.setValue("yearFrom", undefined, {
                                shouldValidate: true,
                              });
                              form.setValue("yearTo", undefined, {
                                shouldValidate: true,
                              });
                            }}
                            disabled={disabledUI}
                          >
                            Clear range
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Number of questions */}
                    <FormField
                      control={form.control}
                      name="numberOfQuestions"
                      render={({ field }) => (
                        <FormItem className="w-full mt-4">
                          <FormLabel>Number of Questions</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "") return field.onChange(0);
                                const n = Number(v);
                                const clamped = Number.isNaN(n)
                                  ? 0
                                  : Math.max(0, Math.min(n, dynamicCap));
                                field.onChange(clamped);
                              }}
                              disabled={disabledUI}
                            />
                          </FormControl>
                          <FormDescription>Up to {dynamicCap}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Selection UI */}
                    <FormField
                      control={form.control}
                      name="coursIds"
                      render={() => (
                        <FormItem className="mt-4">
                          <div className="flex items-center justify-between gap-2">
                            <FormLabel>
                              {isUnite
                                ? "Select modules or specific cours"
                                : "Select cours (multiple)"}
                            </FormLabel>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={
                                    allSelected
                                      ? true
                                      : someSelected
                                      ? "indeterminate"
                                      : false
                                  }
                                  onCheckedChange={handleToggleMaster}
                                  disabled={disabledUI}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {allSelected
                                    ? "All selected"
                                    : someSelected
                                    ? "Some selected"
                                    : "None selected"}
                                </span>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={handleSelectAll}
                                disabled={disabledUI}
                              >
                                Select all
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={handleClearAll}
                                disabled={disabledUI}
                              >
                                Clear
                              </Button>
                            </div>
                          </div>

                          {/* Groups (Unité) */}
                          {isUnite ? (
                            <div className="space-y-3 mt-2">
                              {moduleGroups.map((g) => {
                                const ids = g.cours.map((c) => c.id);
                                const groupAll = ids.every((id) =>
                                  watchedCoursIds.includes(id)
                                );
                                const groupSome =
                                  !groupAll &&
                                  ids.some((id) =>
                                    watchedCoursIds.includes(id)
                                  );

                                const rangeCountForId = (
                                  id: string,
                                  fallback?: number | null
                                ) => {
                                  const perYear = yearIndex[id] ?? {};
                                  if (
                                    !hasYearData ||
                                    Object.keys(perYear).length === 0
                                  ) {
                                    return fallback ?? 0;
                                  }
                                  const from =
                                    typeof yearFrom === "number"
                                      ? yearFrom
                                      : (globalMinYear as number);
                                  const to =
                                    typeof yearTo === "number"
                                      ? yearTo
                                      : (globalMaxYear as number);
                                  let sum = 0;
                                  for (const [ys, cnt] of Object.entries(
                                    perYear
                                  )) {
                                    const y = Number(ys);
                                    if (y >= from && y <= to) sum += cnt;
                                  }
                                  return sum;
                                };

                                const moduleRangeCount = g.cours.reduce(
                                  (acc, c) =>
                                    acc +
                                    rangeCountForId(c.id, c.questionCount),
                                  0
                                );

                                return (
                                  <div
                                    key={g.id}
                                    className="rounded-md border p-2"
                                  >
                                    <div className="flex items-center justify-between px-1 py-1">
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          checked={
                                            groupAll
                                              ? true
                                              : groupSome
                                              ? "indeterminate"
                                              : false
                                          }
                                          disabled={disabledUI}
                                          onCheckedChange={(v) =>
                                            toggleModule(g, v === true)
                                          }
                                        />
                                        <span className="font-medium">
                                          {g.title}
                                        </span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {moduleRangeCount} question
                                        {moduleRangeCount === 1 ? "" : "s"}
                                      </span>
                                    </div>

                                    <div className="mt-2 space-y-1">
                                      {g.cours.map((c) => {
                                        const checked =
                                          watchedCoursIds.includes(c.id);
                                        const rangeCount = rangeCountForId(
                                          c.id,
                                          c.questionCount
                                        );
                                        return (
                                          <div
                                            key={c.id}
                                            className="flex items-start gap-3 rounded-md px-2 py-1 hover:bg-accent"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={checked}
                                                disabled={disabledUI}
                                                onCheckedChange={(v) =>
                                                  toggleCours(c.id, v === true)
                                                }
                                              />
                                            </FormControl>
                                            <div className="grid gap-0.5 leading-tight">
                                              <span className="text-sm">
                                                {c.title}
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                {rangeCount} question
                                                {rangeCount === 1 ? "" : "s"}
                                                {hasYearData && ` in range`}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="rounded-md border p-2 mt-2 space-y-2">
                              {coursOptions.length === 0 && (
                                <p className="px-2 py-1 text-sm text-muted-foreground">
                                  {fetched
                                    ? "No cours available."
                                    : "Loading cours…"}
                                </p>
                              )}

                              {coursOptions.map((c) => {
                                const checked = watchedCoursIds.includes(c.id);
                                const perYear = yearIndex[c.id] ?? {};
                                const from =
                                  typeof yearFrom === "number"
                                    ? yearFrom
                                    : (globalMinYear as number);
                                const to =
                                  typeof yearTo === "number"
                                    ? yearTo
                                    : (globalMaxYear as number);
                                const rangeCount = hasYearData
                                  ? Object.entries(perYear).reduce(
                                      (acc, [ys, cnt]) => {
                                        const y = Number(ys);
                                        return y >= from && y <= to
                                          ? acc + cnt
                                          : acc;
                                      },
                                      0
                                    )
                                  : c.questionCount ?? 0;

                                return (
                                  <div
                                    key={c.id}
                                    className="flex items-start gap-3 rounded-md px-2 py-1 hover:bg-accent"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={checked}
                                        disabled={disabledUI}
                                        onCheckedChange={(v) =>
                                          toggleCours(c.id, v === true)
                                        }
                                      />
                                    </FormControl>
                                    <div className="grid gap-0.5 leading-tight">
                                      <span className="text-sm">{c.title}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {rangeCount} question
                                        {rangeCount === 1 ? "" : "s"}
                                        {hasYearData && ` in range`}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <FormDescription className="mt-2">
                            {isUnite
                              ? "Pick whole modules or drill down to specific cours. Year range and caps adapt automatically."
                              : "Pick one or more cours. If you set a year range, the cap and counts adapt automatically."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </DialogBody>

              {/* FOOTER: sticky, safe-area aware */}
              <DialogFooter
                className="
                  sticky bottom-0 z-10
                  bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
                  border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]
                "
              >
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Close
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={!fetched || loading || submitting}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting…
                    </span>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Pretty loading skeletons ---------- */
function LoadingCoursSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="rounded-md border p-2 space-y-2 mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-md px-2 py-2"
            >
              <Skeleton className="h-4 w-4 rounded-sm" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
