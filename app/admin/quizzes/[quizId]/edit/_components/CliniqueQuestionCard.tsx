"use client";

import React, { useState, useTransition } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, PlusIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import EditQcmModal from "./EditQcmModal";
import DeleteQuestionModal from "./DeleteQuestion";
import NormalQuestionCard from "./NormalQuestionCard";
import type { QuestionItem } from "./QuizStructure";

/* modal bits */
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
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuestionSchema, type questionSchemaType } from "@/lib/zodSchemas";
import { QUESTION_TYPES } from "@/lib/utils";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { createSubQcm } from "../actions";

type Props = {
  item: QuestionItem; // clinical stem (parent)
  quizId: string;
  coursId: string;
  onToggle: (qcmId: string) => void;
  subItems: QuestionItem[]; // its sub-questions
};

const CliniqueQuestionCard: React.FC<Props> = ({
  item,
  quizId,
  coursId,
  onToggle,
  subItems,
}) => {
  return (
    <Card>
      <Collapsible
        open={item.isOpen}
        onOpenChange={() => onToggle(item.id)}
        className="w-full"
      >
        {/* Top: clinical stem */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button size="icon" variant="ghost" className="flex items-center">
                {item.isOpen ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <p className="cursor-pointer hover:text-primary">{item.question}</p>
          </div>
          <div>
            <EditQcmModal
              coursId={coursId}
              quizId={quizId}
              qcmId={item.id}
              question={item.question}
            />
            <DeleteQuestionModal qcmId={item.id} quizId={quizId} />
          </div>
        </div>

        {/* Bottom: sub-questions + "Add sub-question" */}
        <CollapsibleContent>
          <div className="space-y-4 p-2">
            {subItems.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2">
                No sub-questions yet.
              </p>
            ) : (
              subItems.map((sub) => (
                <NormalQuestionCard
                  key={sub.id}
                  item={sub}
                  quizId={quizId}
                  coursId={coursId}
                  onToggle={onToggle}
                />
              ))
            )}

            {/* Add sub-question button */}
            <div className="pt-2">
              <NewSubQcmModal
                parentId={item.id}
                quizId={quizId}
                coursId={coursId}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default CliniqueQuestionCard;

/* ------------------------------------------------------------------ */
/* NewSubQcmModal: small modal to create a sub-question under parent  */
/* ------------------------------------------------------------------ */
function NewSubQcmModal({
  parentId,
  quizId,
  coursId,
}: {
  parentId: string;
  quizId: string;
  coursId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const defaultTypeId = QUESTION_TYPES[0]?.id ?? 1; // usually QCM

  const form = useForm<questionSchemaType>({
    resolver: zodResolver(QuestionSchema) as Resolver<
      questionSchemaType,
      any,
      questionSchemaType
    >,
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

  const handleOpenChange = (open: boolean) => {
    if (!open) resetDefaults();
    setIsOpen(open);
  };

  const onSubmit: SubmitHandler<questionSchemaType> = (values) => {
    startTransition(() => {
      void (async () => {
        const { data, error } = await tryCatch(createSubQcm(parentId, values));
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
        <Button size="sm" variant="outline" className="w-full justify-center">
          <PlusIcon className="size-4" />
          <span className="ml-2">Add sub-question</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New sub-question</DialogTitle>
          <DialogDescription>
            Enter the sub-question and choose its type.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the sub-question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isPending ? "Creating..." : "Create sub-question"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
