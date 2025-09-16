"use client";

import { Button } from "@/components/ui/button";

import { useTransition } from "react";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { createQuizCheckout } from "./actions";

const EnrollementButton = ({ courseId }: { courseId: string }) => {
  const [isPending, startTransition] = useTransition();

  const handleEnroll = () => {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        createQuizCheckout(courseId)
      );
      if (error) {
        toast.error("Failed to create checkout");
        return;
      }
      if (result.status === "error") {
        toast.error(result.message);
        return;
      } else {
        toast.success("Checkout created successfully");
      }
    });
  };

  return (
    <Button
      disabled={isPending}
      onClick={handleEnroll}
      className="w-full font-bold text-lg cursor-pointer"
    >
      {isPending ? "Processing..." : "Enroll Now!"}
    </Button>
  );
};

export default EnrollementButton;
