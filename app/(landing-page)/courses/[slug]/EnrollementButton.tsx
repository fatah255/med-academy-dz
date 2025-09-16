"use client";

import { Button } from "@/components/ui/button";
import { createCheckout } from "./actions";
import { useTransition } from "react";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";

const EnrollementButton = ({ courseId }: { courseId: string }) => {
  const [isPending, startTransition] = useTransition();

  const handleEnroll = () => {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(createCheckout(courseId));
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
