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

type CoursOption = { id: string; title: string; questionCount?: number | null };

export default function StartTest({
  totalQuestions,
  quizId,
  coursOptions,
  yearIndex, // <- { [courseId]: { [year]: count } }
  globalMinYear, // <- number | undefined
  globalMaxYear, // <- number | undefined
}: {
  totalQuestions: number;
  quizId: string;
  coursOptions: CoursOption[];
  yearIndex: Record<string, Record<number, number>>;
  globalMinYear?: number;
  globalMaxYear?: number;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const direction = useDirection();

  const hasYearData =
    typeof globalMinYear === "number" && typeof globalMaxYear === "number";

  const FormSchema = z
    .object({
      numberOfQuestions: z
        .number()
        .int("Must be an integer")
        .min(0, "Number of questions cannot be negative")
        .max(
          totalQuestions,
          `Number of questions cannot exceed ${totalQuestions}`
        ),
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
      yearFrom: hasYearData ? globalMinYear : undefined,
      yearTo: hasYearData ? globalMaxYear : undefined,
    },
    mode: "onSubmit",
  });

  const watchedCoursIds =
    useWatch({ control: form.control, name: "coursIds" }) ?? [];
  const yearFrom = useWatch({ control: form.control, name: "yearFrom" });
  const yearTo = useWatch({ control: form.control, name: "yearTo" });

  // Select-all helpers
  const allIds = useMemo(() => coursOptions.map((c) => c.id), [coursOptions]);
  const allSelected =
    allIds.length > 0 && watchedCoursIds.length === allIds.length;
  const someSelected = watchedCoursIds.length > 0 && !allSelected;

  // Cap based on selected courses AND selected year range (if any)
  const dynamicCap = useMemo(() => {
    // no courses selected
    if (!watchedCoursIds.length) return 0;

    // If no year data at all -> fall back to total selected counts
    const anyYearData = watchedCoursIds.some(
      (cid) => Object.keys(yearIndex[cid] ?? {}).length
    );
    if (!anyYearData) {
      return coursOptions
        .filter((c) => watchedCoursIds.includes(c.id))
        .reduce((acc, c) => acc + (c.questionCount ?? 0), 0);
    }

    // If range not set → treat as all available years
    const from = typeof yearFrom === "number" ? yearFrom : globalMinYear!;
    const to = typeof yearTo === "number" ? yearTo : globalMaxYear!;

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
  ]);

  // Keep input synced with cap
  useEffect(() => {
    form.setValue("numberOfQuestions", dynamicCap, { shouldValidate: true });
  }, [dynamicCap, form]);

  function onSubmit(values: FormValues) {
    if (values.numberOfQuestions > dynamicCap) {
      toast.error(
        `You requested ${values.numberOfQuestions} questions but the selected filters hold only ${dynamicCap}.`
      );
      return;
    }
    const coursParam = values.coursIds.join(",");
    const params = new URLSearchParams({
      ques: String(values.numberOfQuestions),
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

    router.push(`/dashboard/quizzes/${quizId}?${params.toString()}`);
    form.reset();
    setOpen(false);
  }

  // Master controls
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

  // Quick year helpers
  const handleAllYears = () => {
    if (!hasYearData) return;
    form.setValue("yearFrom", globalMinYear, { shouldValidate: true });
    form.setValue("yearTo", globalMaxYear, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-4 w-full">Start a test</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg" dir={direction}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Start Test</DialogTitle>
              <DialogDescription>
                Choose the number of questions, courses, and (optionally) a year
                range.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-6">
              {/* Year Range (optional; only if we have year data) */}
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
                            max={globalMaxYear}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value)
                              )
                            }
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
                            min={globalMinYear}
                            max={globalMaxYear}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value)
                              )
                            }
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
                    >
                      Clear range
                    </Button>
                  </div>
                </div>
              )}

              {/* Number of questions (auto-fills with cap) */}
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
                        max={dynamicCap}
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
                      />
                    </FormControl>
                    <FormDescription>Up to {dynamicCap}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Courses multi-select (with Select All) */}
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
                        >
                          Select all
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleClearAll}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-auto rounded-md border p-2 space-y-2 mt-2">
                      {coursOptions.length === 0 && (
                        <p className="px-2 py-1 text-sm text-muted-foreground">
                          No cours available.
                        </p>
                      )}

                      {coursOptions.map((c) => {
                        const checked = watchedCoursIds.includes(c.id);
                        // Optional: show available count inside current year range
                        const perYear = yearIndex[c.id] ?? {};
                        const from =
                          typeof yearFrom === "number"
                            ? yearFrom
                            : globalMinYear!;
                        const to =
                          typeof yearTo === "number" ? yearTo : globalMaxYear!;
                        const rangeCount = hasYearData
                          ? Object.entries(perYear).reduce((acc, [ys, cnt]) => {
                              const y = Number(ys);
                              return y >= from && y <= to ? acc + cnt : acc;
                            }, 0)
                          : c.questionCount ?? 0;

                        return (
                          <div
                            key={c.id}
                            className="flex items-start gap-3 rounded-md px-2 py-1 hover:bg-accent"
                          >
                            <FormControl>
                              <Checkbox
                                checked={checked}
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
                      Pick one or more cours. If you set a year range, the cap
                      and counts adapt automatically.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </DialogClose>
              <Button type="submit">Continue</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
