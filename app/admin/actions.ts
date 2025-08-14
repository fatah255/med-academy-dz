"use server";

"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireAdmin } from "../data/admin/require-admin";

/** ---------- Helpers ---------- **/
function date30DaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
}

/** 1) Total users */
export async function countTotalUsers() {
  return prisma.user.count();
}

/** 1b) New users in the last 30 days (rolling “last month”) */
export async function countNewUsersLastMonth() {
  return prisma.user.count({
    where: {
      createdAt: { gte: date30DaysAgo() },
    },
  });
}

/** 2) Users enrolled in at least one course with a PAID enrollment */
export async function countUsersWithAtLeastOnePaidEnrollment() {
  return prisma.user.count({
    where: {
      enrollments: {
        some: { status: "PAID" }, // Enrollment.status is a String in your schema
      },
    },
  });
}

export async function countUsersWithAtLeastOnePaidEnrollmentCalendarLastMonth() {
  return prisma.user.count({
    where: {
      enrollments: {
        some: { status: "PAID" }, // Enrollment.status is a String in your schema
      },
      createdAt: { gte: date30DaysAgo() },
    },
  });
}

/** 3) For a given course: total PAID enrollments, and PAID enrollments in last 30 days */
export async function coursePaidEnrollmentStats(courseId: string) {
  const since = date30DaysAgo();

  const [totalPaid, lastMonthPaid] = await Promise.all([
    prisma.enrollment.count({
      where: { courseId, status: "PAID" },
    }),
    prisma.enrollment.count({
      where: { courseId, status: "PAID", createdAt: { gte: since } },
    }),
  ]);

  return { totalPaid, lastMonthPaid };
}

export async function countNewUsersCalendarLastMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 1st day of previous month
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999); // last ms of previous month

  return prisma.user.count({
    where: { createdAt: { gte: start, lte: end } },
  });
}

export async function coursePaidEnrollmentsCalendarLastMonth(courseId: string) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  return prisma.enrollment.count({
    where: {
      courseId,
      status: "PAID",
      createdAt: { gte: start, lte: end },
    },
  });
}

/** Previous calendar month helper (optional) */
function calendarLastMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { start, end };
}

/* -------------------- REVENUE: last 30 days -------------------- */

/** ✅ Recommended: sum Enrollment.amount for PAID enrollments in last 30 days */
export async function totalRevenueLast30Days() {
  const since = date30DaysAgo();
  const res = await prisma.enrollment.aggregate({
    _sum: { amount: true },
    where: { status: "PAID", createdAt: { gte: since } },
  });
  return res._sum.amount ?? 0;
}

export async function totalRevenueLast30DaysUser() {
  const session = await requireAdmin();

  const userId = session.user.id;
  const since = date30DaysAgo();
  const res = await prisma.enrollment.aggregate({
    _sum: { amount: true },
    where: { status: "PAID", createdAt: { gte: since }, userId },
  });
  return res._sum.amount ?? 0;
}

/** 🔁 Alternative: sum course.price for each PAID enrollment in last 30 days */
export async function totalRevenueLast30DaysFromCoursePrice() {
  const since = date30DaysAgo();
  const rows = await prisma.enrollment.findMany({
    where: { status: "PAID", createdAt: { gte: since } },
    select: { course: { select: { price: true } } },
  });
  return rows.reduce((sum, r) => sum + r.course.price, 0);
}

/* --------------- REVENUE: previous calendar month --------------- */

/** Sum Enrollment.amount for PAID enrollments in the previous calendar month */
export async function totalRevenueCalendarLastMonth() {
  const { start, end } = calendarLastMonthRange();
  const res = await prisma.enrollment.aggregate({
    _sum: { amount: true },
    where: { status: "PAID", createdAt: { gte: start, lte: end } },
  });
  return res._sum.amount ?? 0;
}

/** Sum course.price for each PAID enrollment in the previous calendar month */
export async function totalRevenueCalendarLastMonthFromCoursePrice() {
  const { start, end } = calendarLastMonthRange();
  const rows = await prisma.enrollment.findMany({
    where: { status: "PAID", createdAt: { gte: start, lte: end } },
    select: { course: { select: { price: true } } },
  });
  return rows.reduce((sum, r) => sum + r.course.price, 0);
}

type CourseLevel =
  | "FIRST_YEAR"
  | "SECOND_YEAR"
  | "THIRD_YEAR"
  | "FOURTH_YEAR"
  | "FIFTH_YEAR"
  | "SIXTH_YEAR";

/**
 * Returns [{ course: category, enrollments: count }, ...]
 * - Counts only PAID enrollments
 * - Optionally filter by CourseLevel (year)
 * - Optionally filter by time window: since (rolling) or calendar last month
 */
export async function getCategoryEnrollments(opts?: {
  level?: CourseLevel; // e.g. "FIRST_YEAR"
  since?: Date | null; // e.g. new Date(Date.now() - 30*24*60*60*1000)
  calendarLastMonth?: boolean; // if true, ignore `since` and use previous calendar month
}) {
  const level = opts?.level;

  // Build time window
  let createdAtFilter: { gte?: Date; lte?: Date } | undefined;
  if (opts?.calendarLastMonth) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    createdAtFilter = { gte: start, lte: end };
  } else if (opts?.since) {
    createdAtFilter = { gte: opts.since };
  }

  // If level is provided, prefetch course IDs for that level to filter enrollments
  let courseIdFilter: string[] | undefined;
  if (level) {
    const ids = await prisma.course.findMany({
      where: { level },
      select: { id: true },
    });
    courseIdFilter = ids.map((c) => c.id);
    if (courseIdFilter.length === 0) return [];
  }

  // 1) Group enrollments by courseId (only PAID, optionally filtered by time/level)
  const enrollGroups = await prisma.enrollment.groupBy({
    by: ["courseId"],
    where: {
      status: "PAID",
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      ...(courseIdFilter ? { courseId: { in: courseIdFilter } } : {}),
    },
    _count: { _all: true },
  });

  if (enrollGroups.length === 0) return [];

  // 2) Fetch categories for those course IDs
  const courses = await prisma.course.findMany({
    where: { id: { in: enrollGroups.map((g) => g.courseId) } },
    select: { id: true, category: true },
  });
  const catById = new Map(courses.map((c) => [c.id, c.category]));

  // 3) Aggregate counts by category (in case multiple courses share the same category)
  const byCategory = new Map<string, number>();
  for (const g of enrollGroups) {
    const cat = catById.get(g.courseId);
    if (!cat) continue;
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + g._count._all);
  }

  // 4) Shape like your chartData and sort by category name
  return Array.from(byCategory, ([course, enrollments]) => ({
    course,
    enrollments,
  })).sort((a, b) => a.course.localeCompare(b.course));
}

export async function totalCourses() {
  const published = await prisma.course.count({
    where: { status: "PUBLISHED" },
  });
  const draft = await prisma.course.count({ where: { status: "DRAFT" } });
  const archived = await prisma.course.count({ where: { status: "ARCHIVED" } });
  return {
    published,
    draft,
    archived,
  };
}
