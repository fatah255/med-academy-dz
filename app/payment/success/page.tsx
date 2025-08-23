"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
import { useConfetti } from "@/hooks/use-confetti";
import Link from "next/link";
import { useEffect } from "react";

const SuccessPage = () => {
  const confetti = useConfetti;
  useEffect(() => {
    confetti();
  }, [confetti]);
  return (
    <div className="w-full min-h-screen flex flex-1 justify-center items-center">
      <Card className="w-[350px]">
        <CardContent>
          <div className="flex justify-center items-center">
            <Check className="size-12 p-2 bg-green-500/30 text-green-500 rounded-full" />
          </div>
          <div className="mt-3 text-center sm:mt-5 w-full">
            <h2 className="text-lg font-semibold">Payment Successful</h2>
            <Link
              className={buttonVariants({
                className: "w-full mt-4 font-bold text-lg cursor-pointer",
              })}
              href="/dashboard"
            >
              <ArrowLeft className="size-4" />
              Go to your Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessPage;
