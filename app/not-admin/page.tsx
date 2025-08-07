import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ShieldXIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 rounded-full p-4 flex items-center mx-auto">
            <ShieldXIcon className="size-16 text-destructive" />
          </div>
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription className="mex-w-xs mx-auto">
            You are not an Admin!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/" className={buttonVariants({ className: "w-full" })}>
            <ArrowLeft className="mr-1 size-4" />
            Go back to home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default page;
