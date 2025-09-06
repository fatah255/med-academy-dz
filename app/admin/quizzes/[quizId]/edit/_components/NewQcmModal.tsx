"use client";

import { useState, useTransition } from "react";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { QuestionSchema, questionSchemaType } from "@/lib/zodSchemas";
import { QUESTION_TYPES } from "@/lib/utils"; // [{ id:number, name:string }, ...]
import { createQcm } from "../actions";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";

type Props = {
  quizId: string;
  coursId: string;
};

const NewQcmModal = ({ quizId, coursId }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const defaultTypeId = QUESTION_TYPES[0]?.id ?? 1;

  const form = useForm<questionSchemaType>({
    resolver: zodResolver(QuestionSchema) as Resolver<{
      question: string;
      quizId: string;
      coursId: string;
      typeQuestionId: number;
    }>,
    defaultValues: {
      question: "",
      quizId,
      coursId,
      typeQuestionId: defaultTypeId,
    },
  });

  const resetDefaults = () =>
    form.reset({
      question: "",
      quizId,
      coursId,
      typeQuestionId: defaultTypeId,
    });

  function handleOpenChange(open: boolean) {
    if (!open) resetDefaults();
    setIsOpen(open);
  }

  const onSubmit: SubmitHandler<questionSchemaType> = (values) => {
    console.log(values);
    // startTransition must receive a sync callback
    startTransition(() => {
      void (async () => {
        const { data, error } = await tryCatch(createQcm(values));
        if (error) return toast.error("Something went wrong");

        if (data.status === "success") {
          toast.success(data.message);
          resetDefaults();
          setIsOpen(false);
        } else {
          toast.error(data.message);
        }
      })();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon className="size-4" />
          <span className="ml-2">New Question</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create New Question</DialogTitle>
          <DialogDescription>
            Write the question and choose its type.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Question text */}
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question type */}
            <FormField
              control={form.control}
              name="typeQuestionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Type</FormLabel>
                  <Select
                    disabled={isPending}
                    value={String(field.value ?? defaultTypeId)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {QUESTION_TYPES.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Creating..." : "Create Question"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewQcmModal;
