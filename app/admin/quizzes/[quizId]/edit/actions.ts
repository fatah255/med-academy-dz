"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import {
  answerSchema,
  answerSchemaType,
  chapterSchema,
  chapterSchemaType,
  courseSchema,
  courseSchemaType,
  lessonSchema,
  lessonSchemaType,
  qcmSchema,
  qcmSchemaType,
  QuestionSchema,
  questionSchemaType,
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

export const editQuiz = async (
  data: qcmSchemaType,
  quizId: string
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
    const result = qcmSchema.safeParse(data);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid quiz data",
      };
    }
    await prisma.quiz.update({
      where: { id: quizId, userId: user.user.id },
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

export const reorderAnswers = async (
  qcmId: string,
  answers: { id: string; position: number }[],
  quizId: string
): Promise<ApiResponse> => {
  const user = await requireAdmin();

  const req = await request();
  const decision = await aj2.protect(req, {
    fingerprint: user?.user.id || "",
  });
  if (decision.isDenied()) {
    return { status: "error", message: "Request denied" };
  }

  try {
    if (!qcmId || !answers?.length) {
      return { status: "error", message: "Invalid QCM or answers data" };
    }

    // (A) Normalize positions to 1..n (server trusts order, not client numbers)
    const normalized = answers.map((a, i) => ({ id: a.id, position: i + 1 }));

    await prisma.$transaction(async (tx) => {
      // (B) Verify question exists and belongs to the quiz
      const qcm = await tx.qcm.findFirst({
        where: { id: qcmId, quizId },
        select: { id: true },
      });
      if (!qcm) throw new Error("QCM not found for this quiz");

      // (C) Ensure all provided answers belong to this QCM and counts match
      const current = await tx.qcmAnswer.findMany({
        where: { qcmId },
        select: { id: true },
      });
      const currentIds = new Set(current.map((a) => a.id));
      const incomingIds = new Set(normalized.map((a) => a.id));

      // Must include exactly the same set of answers (prevents cross-QCM mistakes)
      if (
        current.length !== normalized.length ||
        [...currentIds].some((id) => !incomingIds.has(id))
      ) {
        throw new Error("Payload must include all answers for this question");
      }

      // (D) Two-phase update to avoid @@unique([qcmId, position]) conflicts
      // 1) Bump all positions so new target values won't collide
      await tx.qcmAnswer.updateMany({
        where: { qcmId },
        data: { position: { increment: 1000 } },
      });

      // 2) Set each answer to its final position (use unique where: id)
      for (const a of normalized) {
        await tx.qcmAnswer.update({
          where: { id: a.id }, // ✅ unique selector
          data: { position: a.position },
        });
      }
    });

    revalidatePath(`/admin/quizzes/${quizId}/edit`);
    return { status: "success", message: "Answers reordered successfully" };
  } catch (e) {
    return {
      status: "error",
      message: "Something went wrong while reordering",
    };
  }
};

export const reorderQcm = async (
  quizId: string,
  qcms: { id: string; position: number }[]
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
    if (!quizId || !qcms || qcms.length === 0) {
      return {
        status: "error",
        message: "Invalid quiz or QCMs data",
      };
    }

    const updates = qcms.map((qcm) =>
      prisma.qcm.update({
        where: { id: qcm.id, quizId: quizId },
        data: { position: qcm.position },
      })
    );

    await prisma.$transaction(updates);
    revalidatePath(`/admin/quizzes/${quizId}/edit`);

    return {
      status: "success",
      message: "QCMs reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
};

export const createQcm = async (
  values: questionSchemaType
): Promise<ApiResponse> => {
  await requireAdmin();
  try {
    const req = await request();
    const decision = await aj2.protect(req, {
      fingerprint: values.quizId,
    });
    if (decision.isDenied()) {
      return {
        status: "error",
        message: "Request denied",
      };
    }
    const result = QuestionSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid question data",
      };
    }
    await prisma.$transaction(async (tx) => {
      const maxPos = await tx.qcm.findFirst({
        where: { quizId: result.data.quizId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      const position = maxPos ? maxPos.position + 1 : 1;
      await tx.qcm.create({
        data: {
          question: result.data.question,
          quizId: result.data.quizId,
          position,
        },
      });
    });
    revalidatePath(`/admin/quizzes/${result.data.quizId}/edit`); // Revalidate the quiz edit page
    return {
      status: "success",
      message: "Question created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create chapter",
    };
  }
};

export const createAnswer = async (
  values: answerSchemaType
): Promise<ApiResponse> => {
  await requireAdmin();

  const parsed = answerSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Invalid answer data" };
  }

  const { quizId, questionId, text, isCorrect } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // (optional but recommended) ensure the question exists and belongs to the quiz
      const qcm = await tx.qcm.findFirst({
        where: { id: questionId, quizId },
        select: { id: true },
      });
      if (!qcm) {
        throw new Error("Question not found for this quiz");
      }

      const maxPos = await tx.qcmAnswer.findFirst({
        where: { qcmId: questionId },
        orderBy: { position: "desc" },
        select: { position: true },
      });

      const position = maxPos ? maxPos.position + 1 : 1;

      await tx.qcmAnswer.create({
        data: {
          text,
          qcmId: questionId, // ✅ FIX: was `quizId`
          isCorrect,
          position,
        },
      });
    });

    revalidatePath(`/admin/quizzes/${quizId}/edit`);
    return { status: "success", message: "Answer created successfully" };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Failed to create answer" };
  }
};

export const deleteAnswer = async (
  answerId: string,
  questionId: string,
  quizId: string
): Promise<ApiResponse> => {
  await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, { fingerprint: quizId }); // or aj2 if that's your instance
    if (decision.isDenied()) {
      return { status: "error", message: "Request denied" };
    }

    // Make sure the question exists and belongs to the quiz
    const qcm = await prisma.qcm.findFirst({
      where: { id: questionId, quizId },
      select: { id: true },
    });
    if (!qcm) {
      return { status: "error", message: "QCM not found for this quiz" };
    }

    // Get the answer to delete (and its position) and ensure it belongs to this question
    const answer = await prisma.qcmAnswer.findFirst({
      where: { id: answerId, qcmId: questionId },
      select: { id: true, position: true },
    });
    if (!answer) {
      return { status: "error", message: "Answer not found" };
    }

    // Do it atomically: delete, then shift down positions > deleted.position
    await prisma.$transaction([
      prisma.qcmAnswer.delete({ where: { id: answer.id } }),
      prisma.qcmAnswer.updateMany({
        where: { qcmId: questionId, position: { gt: answer.position } },
        data: { position: { decrement: 1 } },
      }),
    ]);

    revalidatePath(`/admin/quizzes/${quizId}/edit`);
    return { status: "success", message: "Answer deleted successfully" };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Failed to delete answer" };
  }
};

export const deleteQuestion = async (
  questionId: string,
  quizId: string
): Promise<ApiResponse> => {
  await requireAdmin();
  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: quizId,
    });
    if (decision.isDenied()) {
      return {
        status: "error",
        message: "Request denied",
      };
    }
    const quizWithQuestions = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        qcm: {
          orderBy: { position: "asc" },
          select: { id: true, position: true },
        },
      },
    });
    const questions = quizWithQuestions?.qcm || [];

    if (!questions || questions.length === 0) {
      return {
        status: "error",
        message: "No questions found",
      };
    }
    if (!quizWithQuestions) {
      return {
        status: "error",
        message: "Quiz not found",
      };
    }

    const questionToDelete = questions.find((q) => q.id === questionId);
    if (!questionToDelete) {
      return {
        status: "error",
        message: "Question not found",
      };
    }

    const remainingQuestions = questions.filter((q) => q.id !== questionId);

    const updates = remainingQuestions.map((question, index) =>
      prisma.qcm.update({
        where: { id: question.id },
        data: { position: index + 1 },
      })
    );

    await prisma.$transaction([
      ...updates,
      prisma.qcm.delete({ where: { id: questionId } }),
    ]);

    revalidatePath(`/admin/quizzes/${quizId}/edit`); // Revalidate the quiz edit page
    return {
      status: "success",
      message: "Question deleted successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete question",
    };
  }
};
