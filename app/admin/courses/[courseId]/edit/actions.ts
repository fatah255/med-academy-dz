"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import {
  chapterSchema,
  chapterSchemaType,
  courseSchema,
  courseSchemaType,
  lessonSchema,
  lessonSchemaType,
} from "@/lib/zodSchemas";
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

export const createChapter = async (
  values: chapterSchemaType
): Promise<ApiResponse> => {
  await requireAdmin();
  try {
    const req = await request();
    const decision = await aj2.protect(req, {
      fingerprint: values.courseId,
    });
    if (decision.isDenied()) {
      return {
        status: "error",
        message: "Request denied",
      };
    }
    const result = chapterSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid chapter data",
      };
    }
    await prisma.$transaction(async (tx) => {
      const maxPos = await tx.chapter.findFirst({
        where: { courseId: result.data.courseId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      const position = maxPos ? maxPos.position + 1 : 1;
      await tx.chapter.create({
        data: {
          title: result.data.name,
          courseId: result.data.courseId,
          position,
        },
      });
    });
    revalidatePath(`/admin/courses/${result.data.courseId}/edit`); // Revalidate the course edit page
    return {
      status: "success",
      message: "Chapter created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create chapter",
    };
  }
};

export const createLesson = async (
  values: lessonSchemaType
): Promise<ApiResponse> => {
  await requireAdmin();
  try {
    const req = await request();
    const decision = await aj2.protect(req, {
      fingerprint: values.courseId,
    });

    if (decision.isDenied()) {
      return {
        status: "error",
        message: "Request denied",
      };
    }

    const result = lessonSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid lesson data",
      };
    }

    await prisma.$transaction(async (tx) => {
      const maxPos = await tx.lesson.findFirst({
        where: { chapterId: result.data.chapterId },
        orderBy: { position: "desc" },
        select: { position: true },
      });

      const position = maxPos ? maxPos.position + 1 : 1;

      await tx.lesson.create({
        data: {
          title: result.data.name,

          chapterId: result.data.chapterId,
          description: result.data.description,
          thumbnailKey: result.data.thumbnailKey,
          videoKey: result.data.videoKey,
          position,
        },
      });
    });

    revalidatePath(`/admin/courses/${result.data.courseId}/edit`); // Revalidate the course edit page

    return {
      status: "success",
      message: "Lesson created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create lesson",
    };
  }
};

export const deleteLesson = async (
  lessonId: string,
  chapterId: string,
  courseId: string
): Promise<ApiResponse> => {
  await requireAdmin();
  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: courseId,
    });
    if (decision.isDenied()) {
      return {
        status: "error",
        message: "Request denied",
      };
    }
    const chapterWithLessons = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        lesson: {
          orderBy: { position: "asc" },
          select: { id: true, position: true },
        },
      },
    });

    const lessons = chapterWithLessons?.lesson || [];

    if (!lessons || lessons.length === 0) {
      return {
        status: "error",
        message: "No lessons found",
      };
    }
    if (!chapterWithLessons) {
      return {
        status: "error",
        message: "Chapter not found",
      };
    }

    const lessonToDelete = lessons.find((l) => l.id === lessonId);
    if (!lessonToDelete) {
      return {
        status: "error",
        message: "Lesson not found",
      };
    }

    const remainingLessons = lessons.filter((l) => l.id !== lessonId);

    const updates = remainingLessons.map((lesson, index) =>
      prisma.lesson.update({
        where: { id: lesson.id },
        data: { position: index + 1 },
      })
    );

    await prisma.$transaction([
      ...updates,
      prisma.lesson.delete({ where: { id: lessonId } }),
    ]);

    revalidatePath(`/admin/courses/${courseId}/edit`); // Revalidate the course edit page
    return {
      status: "success",
      message: "Lesson deleted successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete lesson",
    };
  }
};

export const deleteChapter = async (
  chapterId: string,
  courseId: string
): Promise<ApiResponse> => {
  await requireAdmin();
  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: courseId,
    });
    if (decision.isDenied()) {
      return {
        status: "error",
        message: "Request denied",
      };
    }
    const courseWithChapters = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        chapters: {
          orderBy: { position: "asc" },
          select: { id: true, position: true },
        },
      },
    });
    const chapters = courseWithChapters?.chapters || [];

    if (!chapters || chapters.length === 0) {
      return {
        status: "error",
        message: "No chapters found",
      };
    }
    if (!courseWithChapters) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    const chapterToDelete = chapters.find((c) => c.id === chapterId);
    if (!chapterToDelete) {
      return {
        status: "error",
        message: "Chapter not found",
      };
    }

    const remainingChapters = chapters.filter((c) => c.id !== chapterId);

    const updates = remainingChapters.map((chapter, index) =>
      prisma.chapter.update({
        where: { id: chapter.id },
        data: { position: index + 1 },
      })
    );

    await prisma.$transaction([
      ...updates,
      prisma.chapter.delete({ where: { id: chapterId } }),
    ]);

    revalidatePath(`/admin/courses/${courseId}/edit`); // Revalidate the course edit page
    return {
      status: "success",
      message: "Chapter deleted successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete chapter",
    };
  }
};
