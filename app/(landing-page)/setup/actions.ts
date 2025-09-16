"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { revalidatePath } from "next/cache";

type CourseLevel =
  | "FIRST_YEAR"
  | "SECOND_YEAR"
  | "THIRD_YEAR"
  | "FOURTH_YEAR"
  | "FIFTH_YEAR"
  | "SIXTH_YEAR";

export async function completeSetup(formData: FormData) {
  const session = await requireUser();
  const userId = session.user?.id;
  if (!userId) redirect("/");

  const level = (formData.get("level") as string | null)?.toUpperCase();
  if (!level) {
    // You could return a form state error if you want to render it
    redirect("/setup");
  }

  // Persist level + mark setup done
  await prisma.user.update({
    where: { id: userId },
    data: {
      level: level as CourseLevel, // ensure enum values match your schema
      setup: true,
    },
  });

  revalidatePath("/");
  redirect("/dashboard");
}
