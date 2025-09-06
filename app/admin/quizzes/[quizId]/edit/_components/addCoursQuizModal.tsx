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
  chapterSchema,
  chapterSchemaType,
  coursSchema,
  coursSchemaType,
} from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { addCoursQuiz } from "../actions";

const NewCourModal = ({ quizId }: { quizId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(open: boolean) {
    if (!open) {
      form.reset();
    }
    setIsOpen(open);
  }

  async function handleSubmit(values: coursSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(addCoursQuiz(values));
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

  const form = useForm<coursSchemaType>({
    resolver: zodResolver(coursSchema),
    defaultValues: {
      title: "",
      quizId,
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon className="size-4" /> New Chapter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Cours</DialogTitle>
          <DialogDescription>
            Choose a name for your new cours
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Course Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button disabled={isPending} type="submit" className="w-full">
                {isPending ? "Creating..." : "Create Chapter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewCourModal;
