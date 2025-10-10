// app/admin/course-access/actions.ts
"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";

export async function findUserWithEnrollments(email: string) {
  const session = await requireAdmin();

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!user)
    return {
      user: null,
      enrollments: [] as Array<{ courseId: string; status: string }>,
    };

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    select: { courseId: true, status: true },
  });

  return { user, enrollments };
}

export async function grantCoursesToUser(input: {
  email: string;
  courseIds: string[];
  isPrice?: boolean;
}) {
  const session = await requireAdmin();

  const { email, courseIds, isPrice } = input;
  if (!email || courseIds.length === 0) return { ok: true, updated: 0 };

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  if (!user) throw new Error("User not found: " + email);

  // get prices for all courses in one trip
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, price: true },
  });
  const priceById = new Map(courses.map((c) => [c.id, c.price]));

  let updated = 0;

  // Upsert each enrollment to PAID
  for (const courseId of courseIds) {
    const price = priceById.get(courseId) ?? 0;

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      select: { status: true },
    });

    if (!existing) {
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId,
          amount: isPrice ? price : 0,
          status: isPrice ? "PAID" : "paid",
        },
      });
      updated++;
    } else if (existing.status !== "PAID" && existing.status !== "paid") {
      await prisma.enrollment.update({
        where: { userId_courseId: { userId: user.id, courseId } },
        data: {
          amount: isPrice ? price : 0,
          status: isPrice ? "PAID" : "paid",
        },
      });
      updated++;
    }
  }

  return { ok: true, updated };
}
