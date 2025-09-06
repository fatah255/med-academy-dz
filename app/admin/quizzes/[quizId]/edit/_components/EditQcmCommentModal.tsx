"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { updateQcmComment } from "../actions";
import { Pencil } from "lucide-react";

const CommentSchema = z.object({
  quizId: z.string().uuid(),
  coursId: z.string().uuid(),
  comment: z
    .string()
    .trim()
    .max(2000, "Comment must be at most 2000 characters.")
    .optional(),
});

type CommentSchemaType = z.infer<typeof CommentSchema>;

export default function EditQcmCommentModal(props: {
  qcmId: string;
  quizId: string;
  coursId: string;
  defaultComment?: string | null;
  asTextButton?: boolean; // optional styling toggle
}) {
  const { qcmId, quizId, coursId, defaultComment, asTextButton } = props;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<CommentSchemaType>({
    resolver: zodResolver(CommentSchema),
    defaultValues: {
      quizId,
      coursId,
      comment: defaultComment ?? "",
    },
  });

  const reset = () =>
    form.reset({
      quizId,
      coursId,
      comment: defaultComment ?? "",
    });

  const onSubmit = (values: CommentSchemaType) => {
    startTransition(() => {
      void (async () => {
        const { data, error } = await tryCatch(updateQcmComment(qcmId, values));
        if (error) return toast.error("Something went wrong");
        if (data.status === "success") {
          toast.success(data.message);
          setOpen(false);
        } else {
          toast.error(data.message);
        }
      })();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        {asTextButton ? (
          <Button variant="ghost" size="sm" className="px-2">
            <Pencil className="size-4 mr-1" />
            Edit comment
          </Button>
        ) : (
          <Button variant="outline" size="icon" className="mr-1">
            <Pencil className="size-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit comment</DialogTitle>
          <DialogDescription>
            Add or change the comment for this question.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Enter an explanation, note, or correction…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Saving…" : "Save comment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
