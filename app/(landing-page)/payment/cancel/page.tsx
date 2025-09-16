import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, XIcon } from "lucide-react";
import Link from "next/link";

const CancelPage = () => {
  return (
    <div className="w-full min-h-screen flex flex-1 justify-center items-center">
      <Card className="w-[350px]">
        <CardContent>
          <div className="flex justify-center items-center">
            <XIcon className="size-12 p-2 bg-red-500/30 text-red-500 rounded-full" />
          </div>
          <div className="mt-3 text-center sm:mt-5 w-full">
            <h2 className="text-lg font-semibold">Payment Cancelled</h2>
            <Link
              className={buttonVariants({
                className: "w-full mt-4 font-bold text-lg cursor-pointer",
              })}
              href="/"
            >
              <ArrowLeft className="size-4" />
              Go back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CancelPage;
