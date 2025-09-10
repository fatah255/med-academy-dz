// components/exams/exams-locked.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Lock,
  ClipboardList,
  Timer,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

type Props = {
  actionHref?: string; // where to send users (e.g. "/offers" or "/pricing")
  actionLabel?: string; // CTA text
  className?: string;
};

export default function ExamsLocked({
  actionHref = "/#offers",
  actionLabel = "View offers",
  className,
}: Props) {
  return (
    <div
      className={className ?? "flex min-h-[60vh] items-center justify-center"}
    >
      <Card className="w-full max-w-xl border-dashed">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="tracking-tight">Exams are locked</CardTitle>
          </div>
          <CardDescription>
            You don’t have access to exams yet. Enroll in an offer to unlock all
            practice exams and solutions.
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="grid gap-3 py-5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="h-4 w-4" />
            Full exam bank & recent sessions
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="h-4 w-4" />
            Timed mode & score breakdown
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            Detailed solutions & tips
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Already enrolled? Try refreshing your access from your account.
          </p>
          <Button asChild>
            <Link href={actionHref} className="gap-2">
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
