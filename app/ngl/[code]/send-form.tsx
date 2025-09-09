"use client";

import * as React from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Uploader from "@/components/file-uploader/Uploader";
import { toast } from "sonner";

import { createNglMessageByCode } from "@/app/ngl/actions";

const Schema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Please write something.")
    .max(1000, "Max 1000 characters."),
  fileKey: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable()
    .transform((v) => (v ? v : undefined)),
});

type FormValues = z.infer<typeof Schema>;

export default function SendForm({ code }: { code: string }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema) as Resolver<
      { content: string; fileKey: string | undefined },
      any,
      { content: string; fileKey: string | undefined }
    >,
    defaultValues: { content: "", fileKey: undefined },
  });

  const content = form.watch("content") ?? "";
  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    const res = await createNglMessageByCode(code, values); // <-- send both fields
    if (res.status === "success") {
      toast.success(res.message);
      form.reset({ content: "", fileKey: undefined });
    } else {
      toast.error(res.message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {/* Message */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Say something nice…"
                  rows={5}
                  maxLength={1000}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Optional image upload -> stores a fileKey */}
        <FormField
          control={form.control}
          name="fileKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image </FormLabel>
              <FormControl>
                <Uploader
                  fileType="image"
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  anonym
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{content.length}/1000</span>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
