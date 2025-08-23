"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { tryCatch } from "@/hooks/try-catch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useTransition } from "react";
import { toast } from "sonner";
import { deleteCourse } from "./actions";
import { useParams } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

const Page = (): ReactNode => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { courseId } = useParams<{ courseId: string }>();

  function onSubmit() {
    startTransition(async () => {
      const { data, error } = await tryCatch(deleteCourse(courseId));

      if (error) {
        toast.error("Something went wrong while deleting the course");
      }
      if (data?.status === "success") {
        toast.success(data.message);
        router.push("/admin/courses");
      } else {
        toast.error(data?.message);
      }
    });
  }
  return (
    <div className="max-w-xl mx-auto w-full">
      <Card>
        <CardHeader>
          <CardTitle>Delete Course</CardTitle>
          <CardDescription>
            Are you sure you want to delete this course? This action cannot be
            undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex space-x-4 items-center justify-end">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/admin/courses/`}
          >
            Cancel
          </Link>
          <Button
            className="cursor-pointer"
            onClick={onSubmit}
            variant="destructive"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin size-4" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
