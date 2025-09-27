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

type CoursOption = {
  id: string;
  title: string;
  questionCount?: number | null;
};

export default function StartTest({
  totalQuestions,
  quizId,
  coursOptions,
}: {
  totalQuestions: number;
  quizId: string;
  coursOptions: CoursOption[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const direction = useDirection();

  const FormSchema = z.object({
    numberOfQuestions: z
      .number()
      .int("Must be an integer")
      .min(0, "Number of questions cannot be negative")
      .max(
        totalQuestions,
        `Number of questions cannot exceed ${totalQuestions}`
      ),
    coursIds: z.array(z.string()).min(1, "Select at least one cours"),
  });

  type FormValues = z.infer<typeof FormSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      numberOfQuestions: 0,
      coursIds: [],
    },
    mode: "onSubmit",
  });

  // Live watch cours selection
  const watchedCoursIds =
    useWatch({ control: form.control, name: "coursIds" }) ?? [];

  // Helpers for "Select all"
  const allIds = useMemo(() => coursOptions.map((c) => c.id), [coursOptions]);
  const allSelected =
    allIds.length > 0 && watchedCoursIds.length === allIds.length;
  const someSelected = watchedCoursIds.length > 0 && !allSelected;

  // Compute dynamic cap from selected cours
  const dynamicCap = useMemo(() => {
    const picks = watchedCoursIds ?? [];
    const hasPerCoursCounts = coursOptions.some(
      (c) => typeof c.questionCount === "number"
    );

    if (!picks.length) return 0;
    if (!hasPerCoursCounts) return totalQuestions;

    return coursOptions
      .filter((c) => picks.includes(c.id))
      .reduce((acc, c) => acc + (c.questionCount ?? 0), 0);
  }, [coursOptions, totalQuestions, watchedCoursIds]);

  // Always set the input to the CURRENT MAX whenever selection changes
  useEffect(() => {
    form.setValue("numberOfQuestions", dynamicCap, { shouldValidate: true });
  }, [dynamicCap, form]);

  function onSubmit(values: FormValues) {
    if (values.numberOfQuestions > dynamicCap) {
      toast.error(
        `You requested ${values.numberOfQuestions} questions but the selected cours hold only ${dynamicCap}.`
      );
      return;
    }

    const coursParam = values.coursIds.join(",");

    toast.custom((t) => (
      <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
        <AlertIcon>
          <RiCheckboxCircleFill />
        </AlertIcon>
        <AlertTitle>You will be redirected into the test</AlertTitle>
      </Alert>
    ));

    router.push(
      `/dashboard/quizzes/${quizId}?ques=${
        values.numberOfQuestions
      }&cours=${encodeURIComponent(coursParam)}`
    );

    form.reset();
    setOpen(false);
  }

  // Handlers for master controls
  const handleSelectAll = () => {
    form.setValue("coursIds", allIds, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };
  const handleClearAll = () => {
    form.setValue("coursIds", [], { shouldValidate: true, shouldDirty: true });
  };
  const handleToggleMaster = (v: boolean | "indeterminate") => {
    const checked = v === true;
    form.setValue("coursIds", checked ? allIds : [], {
      shouldValidate: true,
      shouldDirty: true,
    });
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
                Choose the number of questions and which cours to include.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-6">
              {/* Number of questions (auto-fills with max) */}
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
                        value={
                          field.value === undefined || field.value === null
                            ? ""
                            : String(field.value)
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "") {
                            field.onChange(0);
                            return;
                          }
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

              {/* Multi-select cours */}
              <FormField
                control={form.control}
                name="coursIds"
                render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Select cours (multiple)</FormLabel>
                      <div className="flex items-center gap-2">
                        {/* Master checkbox with indeterminate */}
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

                        {/* Quick actions */}
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
                        return (
                          <div
                            key={c.id}
                            className="flex items-start gap-3 rounded-md px-2 py-1 hover:bg-accent"
                          >
                            <FormControl>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  const next = v === true; // coerce
                                  const prev = form.getValues("coursIds");
                                  if (next) {
                                    if (!prev.includes(c.id)) {
                                      form.setValue(
                                        "coursIds",
                                        [...prev, c.id],
                                        {
                                          shouldValidate: true,
                                          shouldDirty: true,
                                        }
                                      );
                                    }
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
                              {typeof c.questionCount === "number" && (
                                <span className="text-xs text-muted-foreground">
                                  {c.questionCount} question
                                  {c.questionCount === 1 ? "" : "s"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <FormDescription>
                      Pick one or more cours to pull questions from.
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
