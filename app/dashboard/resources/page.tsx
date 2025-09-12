// app/dashboard/resources/page.tsx (or your current file)
import { getLevel } from "@/app/courses/actions";
import { requireUser } from "@/app/data/user/require-user";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconArchiveOff,
  IconArrowLeft,
  IconBooks,
  IconCompass,
} from "@tabler/icons-react";
import { Suspense } from "react";
import { RenderCoursesSkeleton } from "@/app/courses/page";

type LevelEnum =
  | "FIRST_YEAR"
  | "SECOND_YEAR"
  | "THIRD_YEAR"
  | "FOURTH_YEAR"
  | "FIFTH_YEAR"
  | "SIXTH_YEAR";

const PATH_BY_LEVEL: Record<LevelEnum, string> = {
  FIRST_YEAR: "first",
  SECOND_YEAR: "second",
  THIRD_YEAR: "third",
  FOURTH_YEAR: "fourth",
  FIFTH_YEAR: "fifth",
  SIXTH_YEAR: "sixth",
} as const;

const LABEL_BY_LEVEL: Record<LevelEnum, string> = {
  FIRST_YEAR: "1st year",
  SECOND_YEAR: "2nd year",
  THIRD_YEAR: "3rd year",
  FOURTH_YEAR: "4th year",
  FIFTH_YEAR: "5th year",
  SIXTH_YEAR: "6th year",
} as const;

export default function Page() {
  return (
    <Suspense fallback={<RenderCoursesSkeleton />}>
      <RenderFreeContent />
    </Suspense>
  );
}

async function RenderFreeContent() {
  const session = await requireUser();
  const level = (await getLevel(session.user.id)) as LevelEnum | null;

  // Redirect for levels that currently have free content
  if (
    level === "FIRST_YEAR" ||
    level === "SECOND_YEAR" ||
    level === "THIRD_YEAR"
  ) {
    return redirect(`/dashboard/resources/years/${PATH_BY_LEVEL[level]}`);
  }

  // Pretty empty state for other levels
  const levelLabel = level ? LABEL_BY_LEVEL[level] : "your level";

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/40">
      <div className="container mx-auto max-w-2xl py-12 md:py-16">
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <IconArchiveOff className="size-6" />
            </div>

            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-2xl">No free content (yet)</CardTitle>
              {level ? (
                <Badge variant="secondary" className="ml-1">
                  {levelLabel}
                </Badge>
              ) : null}
            </div>

            <CardDescription>
              We don’t have free resources for {levelLabel} right now. We’re
              adding more soon.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <Separator />
            <ul className="list-disc pl-5 space-y-1">
              <li>Browse our courses catalogue to keep learning.</li>
              <li>Explore earlier-year resources—many topics still help.</li>
              <li>Check back regularly as we publish new content.</li>
            </ul>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard" prefetch={false}>
                <IconArrowLeft className="mr-2 size-4" />
                Back to dashboard
              </Link>
            </Button>

            <Button asChild variant="secondary">
              <Link href="/courses" prefetch={false}>
                <IconBooks className="mr-2 size-4" />
                Browse courses
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
