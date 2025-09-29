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

/* ------------------ Types ------------------ */
type CoursOption = { id: string; title: string; questionCount?: number | null };
type StartInfoPayload = {
  coursOptions: CoursOption[];
  yearIndex: Record<string, Record<number, number>>;
  globalMinYear: number | null;
  globalMaxYear: number | null;
  totalQuestions: number;
};

/* ------------------ Cache helpers ------------------ */
const CACHE_VERSION = "v1"; // bump to invalidate old cache
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

const cacheKey = (quizId: string) =>
  `quiz:start-info:${CACHE_VERSION}:${quizId}`;

type CacheEnvelope = { ts: number; data: StartInfoPayload };

function readCache(quizId: string): CacheEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(quizId));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEnvelope;
  } catch {
    return null;
  }
}

function writeCache(quizId: string, data: StartInfoPayload) {
  if (typeof window === "undefined") return;
  try {
    const env: CacheEnvelope = { ts: Date.now(), data };
    localStorage.setItem(cacheKey(quizId), JSON.stringify(env));
  } catch {
    // ignore quota/etc.
  }
}

function isFresh(env: CacheEnvelope | null) {
  if (!env) return false;
  return Date.now() - env.ts < CACHE_TTL_MS;
}

/* =================================================== */

export default function StartTest({ quizId }: { quizId: string }) {
  const [open, setOpen] = useState(false);
  const [fetched, setFetched] = useState<StartInfoPayload | null>(null);
  const [loading, setLoading] = useState(false); // initial load
  const [refreshing, setRefreshing] = useState(false); // background SWR
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const direction = useDirection();

  /* --------------- Lazy load with cache --------------- */
  useEffect(() => {
    if (!open) return;

    // If we already have data (from first open), do nothing.
    if (fetched || loading || refreshing) return;

    const cached = readCache(quizId);
    if (cached && isFresh(cached)) {
      // Fresh cache: use immediately, no network required.
      setFetched(cached.data);
      // also hydrate the form defaults (below effect will run too)
      return;
    }

    if (cached && !isFresh(cached)) {
      // Stale cache: use it now (instant UI), then revalidate in background.
      setFetched(cached.data);
      setRefreshing(true);
      fetch(`/api/quiz/start-info?quizId=${encodeURIComponent(quizId)}`)
        .then(async (r) => {
          if (!r.ok) throw new Error(await r.text());
          return r.json() as Promise<StartInfoPayload>;
        })
        .then((data) => {
          writeCache(quizId, data);
          setFetched(data);
        })
        .catch((e) => setErr(e.message || "Failed to refresh"))
        .finally(() => setRefreshing(false));
      return;
    }

    // No cache at all: full load
    setLoading(true);
    fetch(`/api/quiz/start-info?quizId=${encodeURIComponent(quizId)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<StartInfoPayload>;
      })
      .then((data) => {
        writeCache(quizId, data);
        setFetched(data);
      })
      .catch((e) => setErr(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [open, fetched, loading, refreshing, quizId]);

  /* --------------- Pluck data --------------- */
  const coursOptions = fetched?.coursOptions ?? [];
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

  // When new data appears (from cache or network), seed form defaults
  useEffect(() => {
    if (!fetched) return;
    form.reset({
      numberOfQuestions: fetched.totalQuestions,
      coursIds: fetched.coursOptions.map((c) => c.id),
      yearFrom:
        typeof fetched.globalMinYear === "number"
          ? fetched.globalMinYear
          : undefined,
      yearTo:
        typeof fetched.globalMaxYear === "number"
          ? fetched.globalMaxYear
          : undefined,
    });
  }, [fetched]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchedCoursIds =
    useWatch({ control: form.control, name: "coursIds" }) ?? [];
  const yearFrom = useWatch({ control: form.control, name: "yearFrom" });
  const yearTo = useWatch({ control: form.control, name: "yearTo" });

  // Select-all helpers
  const allIds = useMemo(() => coursOptions.map((c) => c.id), [coursOptions]);
  const allSelected =
    allIds.length > 0 && watchedCoursIds.length === allIds.length;
  const someSelected = watchedCoursIds.length > 0 && !allSelected;

  // Current cap based on selected courses and year range
  const dynamicCap = useMemo(() => {
    if (!watchedCoursIds.length || !fetched) return 0;

    const anyYearData = watchedCoursIds.some(
      (cid) => Object.keys(yearIndex[cid] ?? {}).length
    );

    if (!anyYearData) {
      return coursOptions
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
    yearIndex,
    yearFrom,
    yearTo,
    globalMinYear,
    globalMaxYear,
    fetched,
  ]);

  // Auto-sync "Number of Questions" to the current cap
  useEffect(() => {
    if (!fetched) return;
    form.setValue("numberOfQuestions", dynamicCap, { shouldValidate: true });
  }, [dynamicCap, fetched, form]);

  /* --------------- Submit --------------- */
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

  const handleAllYears = () => {
    if (!hasYearData) return;
    form.setValue("yearFrom", globalMinYear, { shouldValidate: true });
    form.setValue("yearTo", globalMaxYear, { shouldValidate: true });
  };

  const disabledUI = !fetched || loading;
  const isLoadingUI = (loading && !fetched) || (!fetched && !err);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-4 w-full">Start a test</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg" dir={direction}>
        {/* Top bar: loader + error + refresh hint */}
        {(loading || refreshing) && (
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loading ? "Loading options…" : "Refreshing options…"}
          </div>
        )}
        {err && (
          <p className="mb-2 text-sm text-destructive">
            Failed to load quiz details: {err}
          </p>
        )}

        <Form {...form}>
          {/* Disable native HTML validation so browser doesn't block submit */}
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <DialogHeader>
              <DialogTitle>Start Test</DialogTitle>
              <DialogDescription>
                Choose the number of questions, courses, and (optionally) a year
                range.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-6">
              {isLoadingUI ? (
                <LoadingCoursSkeleton />
              ) : (
                <>
                  {/* Year Range */}
                  {hasYearData && (
                    <div className="grid grid-cols-2 gap-3">
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
                      <div className="col-span-2 flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleAllYears}
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
                      <FormItem className="w-full">
                        <FormLabel>Number of Questions</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            // no max attribute -> no native blocking
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

                  {/* Courses multi-select */}
                  <FormField
                    control={form.control}
                    name="coursIds"
                    render={() => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Select cours (multiple)</FormLabel>
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

                        <div className="max-h-60 overflow-auto rounded-md border p-2 space-y-2 mt-2">
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
                                    onCheckedChange={(v) => {
                                      const prev = form.getValues("coursIds");
                                      if (v === true) {
                                        if (!prev.includes(c.id))
                                          form.setValue(
                                            "coursIds",
                                            [...prev, c.id],
                                            {
                                              shouldValidate: true,
                                              shouldDirty: true,
                                            }
                                          );
                                      } else {
                                        form.setValue(
                                          "coursIds",
                                          prev.filter((x) => x !== c.id),
                                          {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                          }
                                        );
                                      }
                                    }}
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

                        <FormDescription>
                          Pick one or more cours. If you set a year range, the
                          cap and counts adapt automatically.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </DialogBody>

            <DialogFooter>
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
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Pretty loading skeletons ---------- */

function LoadingCoursSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      {/* Years */}
      <div className="grid grid-cols-2 gap-3">
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

      {/* Number of questions */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Course list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="max-h-60 overflow-auto rounded-md border p-2 space-y-2 mt-2">
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
