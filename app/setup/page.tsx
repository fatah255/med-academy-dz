import { redirect } from "next/navigation";
import { requireUser } from "../data/user/require-user";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import LevelCards from "./_components/LevelCards";
import { GraduationCap } from "lucide-react";
import SubmitButton from "./_components/SubmitButton";
import { completeSetup } from "./actions";

const Page = async () => {
  const session = await requireUser();
  if (!session.user?.id) redirect("/");

  const user = await prisma.user.findFirst({
    where: { id: session.user.id },
    select: { setup: true },
  });
  if (user?.setup) redirect("/");

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/40">
      <div className="container mx-auto max-w-3xl py-12">
        <Card className="border-muted/60 shadow-lg">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="rounded-2xl p-2 bg-primary/10 text-primary">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Complete your setup</CardTitle>
              <CardDescription>
                Select your current study level to personalize your content.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form action={completeSetup} className="space-y-6">
              {/* Client UI that sets a hidden input name="level" */}
              <LevelCards />

              <div className="flex items-center justify-end gap-3">
                <a
                  href="/"
                  className="text-sm text-muted-foreground hover:underline underline-offset-4"
                >
                  Skip for now
                </a>
                <SubmitButton />
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          You can change your level anytime from{" "}
          <span className="font-medium">Settings → Profile</span>.
        </p>
      </div>
    </div>
  );
};

export default Page;
