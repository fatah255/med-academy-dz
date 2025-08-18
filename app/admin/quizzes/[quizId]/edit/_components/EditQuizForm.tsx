"use client";

import { Button } from "@/components/ui/button";

import slugify from "slugify";
import { Loader2, PlusIcon, SparklesIcon } from "lucide-react";

import { modulesByYear } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { courseLevels, courseStatus, qcmSchemaType } from "@/lib/zodSchemas";
import { useEffect, useTransition } from "react";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { courseSchema, courseSchemaType } from "@/lib/zodSchemas";
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
import { Textarea } from "@/components/ui/textarea";
import dynamic from "next/dynamic";
import Uploader from "@/components/file-uploader/Uploader";
import { tryCatch } from "@/hooks/try-catch";
import { createCourse } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { editCourse, editQuiz } from "../actions";

import { AdminSingleCourseType } from "@/app/data/admin/admin-get-course";
import { AdminSingleQuizType } from "@/app/data/admin/admin-get-quiz";

const RichTextEditor = dynamic(
  () => import("@/components/rich-text-editor/Editor"),
  {
    ssr: false,
  }
);

interface EditQuizFormProps {
  quiz: AdminSingleQuizType;
}

const EditQuizForm = ({ quiz }: EditQuizFormProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<courseSchemaType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: quiz?.title,
      description: quiz?.description,
      slug: quiz?.slug,
      status: quiz?.status,
      level: quiz?.level,
      category: quiz?.category,

      fileKey: quiz?.fileKey,
      price: quiz?.price,
    },
  });

  const selectedYear = useWatch({
    control: form.control,
    name: "level",
  });
  const categoryLabel =
    selectedYear == "SECOND_YEAR" || selectedYear == "THIRD_YEAR"
      ? "Unité / Module"
      : "Module";
  useEffect(() => {
    if (
      !modulesByYear
        .find((m) => m.year === selectedYear)
        ?.modules.map((m) => m.name)
        .includes(form.getValues("category"))
    ) {
      form.setValue("category", "");
    }
  }, [selectedYear]);

  function onSubmit(values: qcmSchemaType) {
    startTransition(async () => {
      const { data, error } = await tryCatch(editQuiz(values, quiz.id));
      if (error) {
        toast.error("Something went wrong while updating the quiz");
      }
      if (data?.status === "success") {
        toast.success(data?.message);
        form.reset();
        router.push("/admin/quizzes");
      } else {
        toast.error(data?.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <div className="flex gap-4 items-end">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => {
              return (
                <FormItem className="w-full">
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Slug" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <Button
            className="w-fit"
            onClick={() => {
              const title = form.getValues("title");
              const slug = slugify(title);
              form.setValue("slug", slug, {
                shouldValidate: true,
              });
            }}
            type="button"
          >
            <SparklesIcon className="size-4" />
            Generate Slug
          </Button>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => {
            return (
              <FormItem className="w-full">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <RichTextEditor field={field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="fileKey"
          render={({ field }) => {
            return (
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
            );
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() +
                              word.slice(1).toLowerCase()
                          )
                          .join(" ")
                          ? courseLevels
                              .find((level) => level === field.value)
                              ?.split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() +
                                  word.slice(1).toLowerCase()
                              )
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
                              onSelect={() => {
                                form.setValue("level", year);
                              }}
                            >
                              {year
                                .split("_")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1).toLowerCase()
                                )
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
                <FormDescription>
                  Select the year for this course.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            className="mt-2 w-fit"
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
                          .find((group) => group.year === selectedYear)
                          ?.modules.find((m) => m.name === field.value)?.name ||
                          "Select module"}
                        <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4 shrink-0" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Select module..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No module found.</CommandEmpty>
                        <CommandGroup>
                          {modulesByYear
                            .find((group) => group.year === selectedYear)
                            ?.modules.map((module) => (
                              <CommandItem
                                key={module.name}
                                value={module.name}
                                onSelect={() => {
                                  form.setValue("category", module.name);
                                }}
                              >
                                {module.name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    module.name === field.value
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
                  Select the module that this course covers.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => {
              return (
                <FormItem className="w-full">
                  <FormLabel>Price (DZD) </FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="Price" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Status</FormLabel>
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
                        ? courseStatus.find((status) => status === field.value)
                        : "Select status"}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Select status..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No status found.</CommandEmpty>
                      <CommandGroup>
                        {courseStatus.map((status) => (
                          <CommandItem
                            value={status}
                            key={status}
                            onSelect={() => {
                              form.setValue("status", status);
                            }}
                          >
                            {status}
                            <Check
                              className={cn(
                                "ml-auto",
                                status === field.value
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
                Select the status for this course.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              Updating...
              <Loader2 className="animate-spin size-4 ml-2" />
            </>
          ) : (
            <>
              <Check className="mr-2 size-4" />
              Update Quiz
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default EditQuizForm;
