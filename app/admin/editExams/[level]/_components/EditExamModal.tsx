"use client";

import * as React from "react";
import z from "zod";
import { useTransition, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Check, Pen } from "lucide-react";
import { toast } from "sonner";
import { cn, modulesByYear } from "@/lib/utils";
import { updateExam } from "../actions";

type Year =
  | "FIRST_YEAR"
  | "SECOND_YEAR"
  | "THIRD_YEAR"
  | "FOURTH_YEAR"
  | "FIFTH_YEAR"
  | "SIXTH_YEAR";

const schema = z.object({
  module: z.string().min(1, "Please select a module"),
});

type FormValues = z.infer<typeof schema>;

export default function EditExamModal({
  selectedYear,
  examId,
  module, // current module label from DB
}: {
  selectedYear: Year;
  examId: string;
  module: string;
}) {
  const [open, setOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false); // ← track Popover open
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { module: module ?? "" },
    mode: "onSubmit",
  });

  // Reset module if year changes and current module isn’t in that year
  useEffect(() => {
    const allowed = modulesByYear
      .find((g) => g.year === selectedYear)
      ?.modules.map((m) => m.name);
    if (!allowed?.includes(form.getValues("module"))) {
      form.setValue("module", "");
    }
  }, [selectedYear, form]);

  function onOpenChange(next: boolean) {
    if (!next) form.reset({ module: module ?? "" });
    setOpen(next);
  }

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const res = await updateExam(examId, { module: values.module });
      if (res.status === "success") {
        toast.success(res.message);
        setOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  const yearGroup = modulesByYear.find((g) => g.year === selectedYear);
  const moduleList = yearGroup?.modules ?? [];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" className="mr-1">
          <Pen className="size-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent
      // IMPORTANT: keep the dialog open while the combobox popover is open
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit exam</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Current module: <span className="font-medium">{module}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <FormField
              control={form.control}
              name="module"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Module</FormLabel>

                  <Popover
                    modal={false} // don’t trap focus; we let the dialog manage it
                    open={comboOpen}
                    onOpenChange={setComboOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-[240px] justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Select module"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <PopoverContent
                      className="w-[240px] p-0"
                      // Prevent clicks inside the popover from closing the dialog
                      onPointerDownOutside={(e) => e.preventDefault()}
                      onInteractOutside={(e) => e.preventDefault()}
                    >
                      <Command>
                        <CommandInput
                          placeholder="Search module..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No module found.</CommandEmpty>
                          <CommandGroup>
                            {moduleList.map((m) => (
                              <CommandItem
                                key={m.name}
                                value={m.name}
                                onSelect={(val) => {
                                  form.setValue("module", val, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });
                                  setComboOpen(false);
                                }}
                              >
                                {m.name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    field.value === m.name
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <FormDescription>
                    Select the module this exam covers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <Button
                type="submit"
                disabled={isPending || !form.getValues("module")}
              >
                {isPending ? "Updating…" : "Update exam"}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
