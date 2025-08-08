"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { courseSchema, courseSchemaType } from "@/lib/zodSchemas";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

const aj = arcjet
  .withRule(
    detectBot({
      mode: "LIVE",
      allow: [],
    })
  )
  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 5,
    })
  );

export const editCourse = async (
  data: courseSchemaType,
  courseId: string
): Promise<ApiResponse> => {
  const user = await requireAdmin();
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: user?.user.id || "",
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Request denied",
    };
  }

  try {
    const result = courseSchema.safeParse(data);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid course data",
      };
    }
    await prisma.course.update({
      where: { id: courseId, userId: user.user.id },
      data: {
        ...result.data,
      },
    });
    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
};

const aj2 = arcjet
  .withRule(
    detectBot({
      mode: "LIVE",
      allow: [],
    })
  )
  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 20,
    })
  );

export const reorderLessons = async (
  chapterId: string,
  lessons: {
    id: string;
    position: number;
  }[],
  courseId: string
): Promise<ApiResponse> => {
  const user = await requireAdmin();
  const req = await request();
  const decision = await aj2.protect(req, {
    fingerprint: user?.user.id || "",
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Request denied",
    };
  }

  try {
    if (!chapterId || !lessons || lessons.length === 0) {
      return {
        status: "error",
        message: "Invalid chapter or lessons data",
      };
    }

    const updates = lessons.map((lesson) =>
      prisma.lesson.update({
        where: { id: lesson.id, chapterId: chapterId },
        data: { position: lesson.position },
      })
    );

    await prisma.$transaction(updates);
    return {
      status: "success",
      message: "Lessons reordered successfully",
    };

    revalidatePath(`/admin/courses/${courseId}/edit`);
  } catch {
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
};

export const reorderChapters = async (
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> => {
  const user = await requireAdmin();
  const req = await request();
  const decision = await aj2.protect(req, {
    fingerprint: user?.user.id || "",
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Request denied",
    };
  }

  try {
    if (!courseId || !chapters || chapters.length === 0) {
      return {
        status: "error",
        message: "Invalid course or chapters data",
      };
    }

    const updates = chapters.map((chapter) =>
      prisma.chapter.update({
        where: { id: chapter.id, courseId: courseId },
        data: { position: chapter.position },
      })
    );

    await prisma.$transaction(updates);
    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapters reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
};
