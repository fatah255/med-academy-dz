"use client";

import { useState } from "react";
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
  FormMessage,
} from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useDirection } from "@radix-ui/react-direction";
import { RiCheckboxCircleFill } from "@remixicon/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
export default function PreviewQuizModal({
  totalQuestions,
  quizId,
}: {
  totalQuestions: number;
  quizId: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const direction = useDirection();
  const FormSchema = z.object({
    numberOfQuestions: z
      .number()
      .min(1, "Number of questions is required")
      .max(
        totalQuestions,
        `Number of questions cannot exceed ${totalQuestions}`
      ),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { numberOfQuestions: 1 },
    mode: "onSubmit",
  });
  function onSubmit() {
    toast.custom((t) => (
      <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
        <AlertIcon>
          <RiCheckboxCircleFill />
        </AlertIcon>
        <AlertTitle>You will bre redirected into the test</AlertTitle>
      </Alert>
    ));
    console.log("Form submitted with values:", form.getValues());
    router.push(
      `/dashboard/quizzes/${quizId}?ques=${form.getValues().numberOfQuestions}`
    );
    form.reset();
    setOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Eye className="mr-2 size-4" />
        Preview Quiz
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir={direction}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Start Test</DialogTitle>
              <DialogDescription>
                Set the number of questions for the test.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <FormField
                control={form.control}
                name="numberOfQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Enter number of questions"
                        type="number"
                        min={1}
                        max={totalQuestions}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      choose a number between 1 and {totalQuestions}
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
