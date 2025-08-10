"use client";

import { AdminLessonType } from "@/app/data/admin/admin-get-lesson";
import Uploader from "@/components/file-uploader/Uploader";
import RichTextEditor from "@/components/rich-text-editor/Editor";
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
import { lessonSchema, lessonSchemaType } from "@/lib/zodSchemas";
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
      videoKey: data.videoKey ?? undefined,
      chapterId: chapterId,
      courseId: courseId,
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
                    <FormLabel>image cover</FormLabel>
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

              <FormField
                control={form.control}
                name="videoKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>video file for the lesson</FormLabel>
                    <FormControl>
                      <Uploader
                        fileType="video"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit">Save Lesson</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonForm;
