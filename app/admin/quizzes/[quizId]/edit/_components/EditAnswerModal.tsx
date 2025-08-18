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
import { answerSchema, answerSchemaType } from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pen, PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { createAnswer } from "../actions";
import { Checkbox } from "@/components/ui/checkbox";
import { updateAnswer } from "@/app/admin/courses/[courseId]/edit/actions";

const EditAnswerModal = ({
  quizId,
  qcmId,
  answerText,
  answerId,
  isCorrect,
}: {
  answerText: string;
  answerId: string;
  isCorrect: boolean;
  quizId: string;
  qcmId: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(open: boolean) {
    if (!open) {
      form.reset();
    }
    setIsOpen(open);
  }

  async function handleSubmit(values: answerSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        updateAnswer(answerId, values)
      );
      if (error) {
        toast.error("Something went wrong");
        return;
      }
      if (result.status === "success") {
        toast.success(result.message);
        form.reset();
        setIsOpen(false);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  const form = useForm<answerSchemaType>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      text: answerText,
      quizId,
      questionId: qcmId,
      isCorrect,
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mr-1" size={"icon"}>
          <Pen className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Answer</DialogTitle>
          <DialogDescription>
            edit the answer text and select if it's correct or not
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text</FormLabel>
                  <FormControl>
                    <Input placeholder="Answer Text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isCorrect"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      id="isCorrect"
                      checked={!!field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormLabel htmlFor="isCorrect" className="font-normal">
                    Is Correct
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                disabled={isPending}
                type="submit"
                variant="default"
                className="w-full"
              >
                {isPending ? "Updating..." : "Update answer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAnswerModal;
