"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import slugify from "slugify";
import { ArrowLeft, Loader2, PlusIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { modulesByYear } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  courseLevels,
  courseStatus,
  QcmCreateInput,
  qcmCreateSchema,
} from "@/lib/zodSchemas";
import { useEffect, useState, useTransition } from "react";

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
import { useConfetti } from "@/hooks/use-confetti";

const RichTextEditor = dynamic(
  () => import("@/components/rich-text-editor/Editor"),
  {
    ssr: false,
  }
);

const page = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<QcmCreateInput>({
    resolver: zodResolver(qcmCreateSchema),
    defaultValues: {
      question: "",
      answers: [
        { text: "", isCorrect: false, order: 1 },
        { text: "", isCorrect: false, order: 2 },
        { text: "", isCorrect: false, order: 3 },
        { text: "", isCorrect: false, order: 4 },
      ],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "answers",
  });

  const addAnswer = () => {
    const orders = form.getValues("answers").map((a) => a.order);
    const nextOrder = orders.length ? Math.max(...orders) + 1 : 1;
    if (fields.length >= 4) return;
    append({ text: "", isCorrect: false, order: nextOrder });
  };

  function onSubmit(values: QcmCreateInput) {
    startTransition(async () => {
      const { data, error } = await tryCatch(createQCM(values));

      if (error) {
        toast.error("Something went wrong while creating the course");
      }
      if (data?.status === "success") {
        toast.success(data.message);
        useConfetti();
        form.reset();
        router.push("/admin/quizzes");
      } else {
        toast.error(data?.message);
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Link
          href="/admin/quizzes"
          className={buttonVariants({
            variant: "outline",
            size: "icon",
          })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-2xl font-bold">Create Quiz</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Provide basic information about the quiz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Question" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    Creating...
                    <Loader2 className="animate-spin size-4 ml-2" />
                  </>
                ) : (
                  <>
                    <PlusIcon className="mr-2 size-4" />
                    Create Quiz
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};

export default page;
