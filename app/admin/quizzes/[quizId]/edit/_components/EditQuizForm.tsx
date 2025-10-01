// app/admin/quizzes/[id]/_components/EditQuizForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Loader2,
  SparklesIcon,
  ChevronsUpDown,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import slugify from "slugify";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn, modulesByYear } from "@/lib/utils";
import Uploader from "@/components/file-uploader/Uploader";
import { toast } from "sonner";
import { tryCatch } from "@/hooks/try-catch";
import { editQuiz } from "../actions";
import { courseLevels, qcmSchema, qcmSchemaType } from "@/lib/zodSchemas";
import { AdminSingleQuizType } from "@/app/data/admin/admin-get-quiz";
import { Switch } from "@/components/ui/switch"; // shadcn/ui

const RichTextEditor = dynamic(
  () => import("@/components/rich-text-editor/Editor"),
  { ssr: false }
);

interface EditQuizFormProps {
  quiz: AdminSingleQuizType; // make sure this includes: isUnite, quizModules: {id,title}[]
}

export default function EditQuizForm({ quiz }: EditQuizFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<qcmSchemaType>({
    resolver: zodResolver(qcmSchema),
    defaultValues: {
      title: quiz?.title,
      description: quiz?.description,
      slug: quiz?.slug,
      status: quiz?.status,
      level: quiz?.level,
      category: quiz?.category ?? "",
      fileKey: quiz?.fileKey ?? undefined,
      price: quiz?.price ?? undefined,

      // NEW defaults
      isUnite: quiz?.isUnite ?? false,
      modules: (quiz?.quizModules ?? []).map((m) => ({
        id: m.id,
        title: m.title,
      })),
    },
  });

  const selectedYear = useWatch({ control: form.control, name: "level" });
  const isUnite = useWatch({ control: form.control, name: "isUnite" });

  // Dynamic modules editor
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  // Reset module picker value if year changed and current category not valid
  useEffect(() => {
    if (
      !modulesByYear
        .find((m) => m.year === selectedYear)
        ?.modules.map((m) => m.name)
        .includes(form.getValues("category") || "")
    ) {
      form.setValue("category", "");
    }
  }, [selectedYear, form]);

  // If user turns off Unite, we keep modules in form state but they won't be used by backend.
  // If you prefer clearing, uncomment:
  // useEffect(() => { if (!isUnite) form.setValue("modules", []); }, [isUnite, form]);

  const categoryLabel =
    selectedYear === "SECOND_YEAR" || selectedYear === "THIRD_YEAR"
      ? "Unité / Module"
      : "Module";

  function onSubmit(values: qcmSchemaType) {
    startTransition(async () => {
      const payload = {
        ...values,
        // Ensure slug present
        slug: values.slug?.trim() || slugify(values.title),
        // If not unite, ignore modules on the server
      };

      const { data, error } = await tryCatch(editQuiz(payload, quiz.id));
      if (error) {
        toast.error("Something went wrong while updating the quiz");
        return;
      }
      if (data?.status === "success") {
        toast.success(data?.message);
        router.push("/admin/quizzes");
      } else {
        toast.error(data?.message ?? "Update failed");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Slug + Generate */}
        <div className="flex gap-4 items-end">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Slug" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            className="w-fit"
            type="button"
            onClick={() =>
              form.setValue("slug", slugify(form.getValues("title") || ""), {
                shouldValidate: true,
              })
            }
          >
            <SparklesIcon className="size-4" />
            Generate Slug
          </Button>
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <RichTextEditor field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cover */}
        <FormField
          control={form.control}
          name="fileKey"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Cover</FormLabel>
              <FormControl>
                <Uploader
                  fileType="image"
                  onChange={field.onChange}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Year + Category picker (category hidden when Unite) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Year */}
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Academic Year</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-[200px] justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? field.value
                              .split("_")
                              .map((w) => w[0] + w.slice(1).toLowerCase())
                              .join(" ")
                          : "Select year"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Select year..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No year found.</CommandEmpty>
                        <CommandGroup>
                          {courseLevels.map((year) => (
                            <CommandItem
                              value={year}
                              key={year}
                              onSelect={() => form.setValue("level", year)}
                            >
                              {year
                                .split("_")
                                .map((w) => w[0] + w.slice(1).toLowerCase())
                                .join(" ")}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  year === field.value
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
                <FormDescription>Select the year.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category – only when NOT Unite */}
          {!isUnite && (
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex flex-col mt-1">
                  <FormLabel>{categoryLabel}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-fit justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {modulesByYear
                            .find((g) => g.year === selectedYear)
                            ?.modules.find((m) => m.name === field.value)
                            ?.name || "Select module"}
                          <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4 shrink-0" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Select module..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No module found.</CommandEmpty>
                          <CommandGroup>
                            {modulesByYear
                              .find((g) => g.year === selectedYear)
                              ?.modules.map((m) => (
                                <CommandItem
                                  key={m.name}
                                  value={m.name}
                                  onSelect={() =>
                                    form.setValue("category", m.name)
                                  }
                                >
                                  {m.name}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      m.name === field.value
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
                    Select the module this quiz covers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Price */}
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Price (DZD)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={field.value == null ? "" : String(field.value)}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") return field.onChange(undefined);
                    const n = Number(v);
                    field.onChange(Number.isNaN(n) ? undefined : n);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Status</FormLabel>
              {/* ... keep your status popover as-is ... */}
              {/* (omitted here for brevity — unchanged from your code) */}
            </FormItem>
          )}
        />

        {/* NEW: Unite toggle */}
        <FormField
          control={form.control}
          name="isUnite"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border p-3">
              <div>
                <FormLabel>Unité quiz</FormLabel>
                <FormDescription>
                  When enabled, you can define custom modules for this quiz.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* NEW: Modules editor – visible only when Unite */}
        {isUnite && (
          <FormItem className="rounded-md border p-3">
            <FormLabel>Modules</FormLabel>
            <FormDescription>
              Add one or more module names for this quiz.
            </FormDescription>

            <div className="mt-3 space-y-2">
              {fields.map((f, idx) => (
                <div key={f.id} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`modules.${idx}.title`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={`Module #${idx + 1}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(idx)}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => append({ title: "" })}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add module
              </Button>
            </div>
          </FormItem>
        )}

        {/* Submit */}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              Updating... <Loader2 className="animate-spin size-4 ml-2" />
            </>
          ) : (
            <>
              {" "}
              <Check className="mr-2 size-4" /> Update Quiz{" "}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
