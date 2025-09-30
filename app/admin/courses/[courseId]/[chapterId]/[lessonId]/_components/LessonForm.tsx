// app/admin/lessons/[id]/LessonForm.tsx
"use client";

import { AdminLessonType } from "@/app/data/admin/admin-get-lesson";
import Uploader from "@/components/file-uploader/Uploader"; // keep for images
import MuxUploader from "@/components/file-uploader/MuxUploader";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { tryCatch } from "@/hooks/try-catch";
import { lessonSchema, lessonSchemaType } from "@/lib/zodSchemas"; // add muxVideoId?: string
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { updateLesson } from "../actions";
import { toast } from "sonner";

interface LessonFormProps {
  data: AdminLessonType;
  chapterId: string;
  courseId: string;
}

const LessonForm = ({ data, chapterId, courseId }: LessonFormProps) => {
  const form = useForm<lessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: data.title,
      description: data.description ?? undefined,
      thumbnailKey: data.thumbnailKey ?? undefined,
      // 🔄 we now bind muxVideoId instead of videoKey
      muxVideoId: data.muxVideoId ?? undefined,
      // keep legacy videoKey around if you still need to show it / migrate it
      videoKey: undefined,
      chapterId,
      courseId,
    },
  });

  const [isPending, startTransition] = useTransition();

  function onSubmit(values: lessonSchemaType) {
    startTransition(async () => {
      const { data: response, error } = await tryCatch(
        updateLesson(values, data.id)
      );

      if (error) {
        toast.error("Something went wrong while updating the lesson");
        return;
      }
      if (response?.status === "success") {
        toast.success(response?.message);
      } else {
        toast.error(response?.message);
      }
    });
  }

  return (
    <div>
      <Link
        className={buttonVariants({ variant: "outline", className: "mb-6" })}
        href={`/admin/courses/${courseId}/edit`}
      >
        <ArrowLeft className="size-4" />
        Go back
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Lesson configuration</CardTitle>
          <CardDescription>
            Configure the settings for the lesson here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter lesson name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter lesson description"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumbnailKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image cover</FormLabel>
                    <FormControl>
                      <Uploader
                        fileType="image"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 🔁 NEW: Mux uploader updates muxVideoId (playbackId) */}
              <FormField
                control={form.control}
                name="muxVideoId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MuxUploader
                        value={field.value}
                        onChange={field.onChange}
                        label="Lesson Video"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit">
                {isPending ? "Saving..." : "Save Lesson"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonForm;
