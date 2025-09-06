"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import {
  answerSchema,
  answerSchemaType,
  qcmSchema,
  qcmSchemaType,
  QuestionSchema,
  questionSchemaType,
} from "@/lib/zodSchemas";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

// ------------------------------------------------------------------
// Arcjet instances
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// Edit quiz (metadata/body stored in your qcmSchema)
// ------------------------------------------------------------------
export const editQuiz = async (
  data: qcmSchemaType,
  quizId: string
): Promise<ApiResponse> => {
  const user = await requireAdmin();
  const req = await request();
  const decision = await aj.protect(req, { fingerprint: user?.user.id || "" });
  if (decision.isDenied()) {
    return { status: "error", message: "Request denied" };
  }

  try {
    const parsed = qcmSchema.safeParse(data);
    if (!parsed.success) {
      return { status: "error", message: "Invalid quiz data" };
    }

    await prisma.$transaction(async (tx) => {
      // Ensure ownership
      const ok = await tx.quiz.findFirst({
        where: { id: quizId, userId: user.user.id },
        select: { id: true },
      });
      if (!ok) throw new Error("Quiz not found or unauthorized");

      await tx.quiz.update({
        where: { id: quizId }, // unique selector only
        data: parsed.data,
      });
    });

    revalidatePath(`/admin/quizzes/${quizId}/edit`);
    return { status: "success", message: "Quiz updated successfully" };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Something went wrong" };
  }
};

// ------------------------------------------------------------------
// Reorder answers within a single QCM (question)
// ------------------------------------------------------------------
export const reorderAnswers = async (
  qcmId: string,
  answers: { id: string; position: number }[],
  quizId: string
): Promise<ApiResponse> => {
  const user = await requireAdmin();
  const req = await request();
  const decision = await aj2.protect(req, { fingerprint: user?.user.id || "" });
  if (decision.isDenied()) {
    return { status: "error", message: "Request denied" };
  }

  try {
    if (!qcmId || !answers?.length) {
      return { status: "error", message: "Invalid QCM or answers data" };
    }

    // Normalize to 1..n based on array order
    const normalized = answers.map((a, i) => ({ id: a.id, position: i + 1 }));

    await prisma.$transaction(async (tx) => {
      // Verify the QCM belongs to this quiz (via cours -> quizId)
      const qcm = await tx.qcm.findFirst({
        where: { id: qcmId, cours: { quizId } },
        select: { id: true },
      });
      if (!qcm) throw new Error("QCM not found for this quiz");

      // Must include exactly all current answers (prevent cross-question mixups)
      const current = await tx.qcmAnswer.findMany({
        where: { qcmId },
        select: { id: true },
      });
      const currentIds = new Set(current.map((a) => a.id));
      const incomingIds = new Set(normalized.map((a) => a.id));

      if (
        current.length !== normalized.length ||
        [...currentIds].some((id) => !incomingIds.has(id))
      ) {
        throw new Error("Payload must include all answers for this question");
      }

      // Two-phase to avoid @@unique([qcmId, position]) collisions
      await tx.qcmAnswer.updateMany({
        where: { qcmId },
        data: { position: { increment: 1000 } },
      });

      for (const a of normalized) {
        await tx.qcmAnswer.update({
          where: { id: a.id }, // unique
          data: { position: a.position },
        });
      }
    });

    revalidatePath(`/admin/quizzes/${quizId}/edit`);
    return { status: "success", message: "Answers reordered successfully" };
  } catch (e) {
    console.error(e);
    return {
      status: "error",
      message: "Something went wrong while reordering",
    };
  }
};

// ------------------------------------------------------------------
// Reorder QCMs inside a given cours
// ------------------------------------------------------------------
export const reorderQcm = async (
  quizId: string,
  coursId: string,
  qcms: { id: string; position: number }[]
): Promise<ApiResponse> => {
  const user = await requireAdmin();
  const req = await request();
  const decision = await aj2.protect(req, { fingerprint: user?.user.id || "" });
  if (decision.isDenied()) {
    return { status: "error", message: "Request denied" };
  }

  try {
    if (!quizId || !coursId || !qcms?.length) {
      return { status: "error", message: "Invalid quiz/cours or QCMs data" };
    }

    await prisma.$transaction(async (tx) => {
      // Ensure the cours belongs to this quiz
      const c = await tx.cours.findFirst({
        where: { id: coursId, quizId },
        select: { id: true },
      });
      if (!c) throw new Error("Cours not found for this quiz");

      // Ensure the provided set matches exactly the QCMs of this cours
      const current = await tx.qcm.findMany({
        where: { coursId },
        select: { id: true },
      });
      const currentIds = new Set(current.map((q) => q.id));
      const incomingIds = new Set(qcms.map((q) => q.id));

      if (
        current.length !== qcms.length ||
        [...currentIds].some((id) => !incomingIds.has(id))
      ) {
        throw new Error("Payload must include all QCMs of this cours");
      }

      // Two-phase to be safe if you later enforce unique (coursId, position)
      await tx.qcm.updateMany({
        where: { coursId },
        data: { position: { increment: 1000 } },
      });

      for (const q of qcms) {
        await tx.qcm.update({
          where: { id: q.id },
          data: { position: q.position },
        });
      }
    });

    revalidatePath(`/admin/quizzes/${quizId}/edit`);
    return { status: "success", message: "QCMs reordered successfully" };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Something went wrong" };
  }
};

// ------------------------------------------------------------------
// Create QCM (question) inside a cours
// parsed values must contain: quizId, coursId, question
// ------------------------------------------------------------------
export const createQcm = async (
  values: questionSchemaType
): Promise<ApiResponse> => {
  await requireAdmin();

  try {
    const req = await request();
    const decision = await aj2.protect(req, { fingerprint: values.quizId });
    if (decision.isDenied()) {
      return { status: "error", message: "Request denied" };
    }

    const parsed = QuestionSchema.safeParse(values);
    if (!parsed.success) {
      return { status: "error", message: "Invalid question data" };
    }

    await prisma.$transaction(async (tx) => {
      // Verify cours belongs to quiz
      const ok = await tx.cours.findFirst({
        where: { id: parsed.data.coursId, quizId: parsed.data.quizId },
        select: { id: true },
      });
      if (!ok) throw new Error("Cours not found for this quiz");

      const maxPos = await tx.qcm.findFirst({
        where: { coursId: parsed.data.coursId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      const position = maxPos ? maxPos.position + 1 : 1;

      await tx.qcm.create({
        data: {
          question: parsed.data.question,
          coursId: parsed.data.coursId,
          position,
        },
      });
    });

    revalidatePath(
      `/admin/quizzes/${parsed.data.quizId}/edit/${parsed.data.coursId}`
    );
    return { status: "success", message: "Question created successfully" };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Failed to create question" };
  }
};

// ------------------------------------------------------------------
// Update QCM text (verify via cours.quizId)
// ------------------------------------------------------------------
export const updateQcm = async (
  qcmId: string,
  values: questionSchemaType
): Promise<ApiResponse> => {
  await requireAdmin();

  const parsed = QuestionSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Invalid question data" };
  }

  const { quizId, question } = parsed.data;

  try {
    const req = await request();
    const decision = await aj2.protect(req, { fingerprint: quizId });
    if (decision.isDenied()) {
      return { status: "error", message: "Request denied" };
    }

    await prisma.$transaction(async (tx) => {
      const exists = await tx.qcm.findFirst({
        where: { id: qcmId, cours: { quizId } },
        select: { id: true },
      });
      if (!exists) throw new Error("QCM not found for this quiz");

      await tx.qcm.update({
        where: { id: qcmId },
        data: { question },
      });
    });

    revalidatePath(`/admin/quizzes/${quizId}/edit/${parsed.data.coursId}`);
    return { status: "success", message: "Question updated successfully" };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Failed to update question" };
  }
};

// ------------------------------------------------------------------
// Create answer for a QCM
// expects: { quizId, questionId, text, isCorrect }
// ------------------------------------------------------------------
export const createAnswer = async (
  coursId: string,
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
      // Ensure question belongs to the quiz (via cours)
      const qcm = await tx.qcm.findFirst({
        where: { id: questionId, cours: { quizId } },
        select: { id: true },
      });
      if (!qcm) throw new Error("Question not found for this quiz");

      const maxPos = await tx.qcmAnswer.findFirst({
        where: { qcmId: questionId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      const position = maxPos ? maxPos.position + 1 : 1;

      await tx.qcmAnswer.create({
        data: {
          text,
          qcmId: questionId, // link to QCM
          isCorrect,
          position,
        },
      });
    });

    revalidatePath(`/admin/quizzes/${quizId}/edit/${coursId}`);
    return { status: "success", message: "Answer created successfully" };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Failed to create answer" };
  }
};

// ------------------------------------------------------------------
// Delete answer and renumber remaining positions in that QCM
// ------------------------------------------------------------------
export const deleteAnswer = async (
  answerId: string,
  questionId: string,
  quizId: string,
  coursId: string
): Promise<ApiResponse> => {
  await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, { fingerprint: quizId });
    if (decision.isDenied()) {
      return { status: "error", message: "Request denied" };
    }

    // Verify question belongs to quiz
    const qcm = await prisma.qcm.findFirst({
      where: { id: questionId, cours: { quizId } },
      select: { id: true },
    });
    if (!qcm) {
      return { status: "error", message: "QCM not found for this quiz" };
    }

    const answer = await prisma.qcmAnswer.findFirst({
      where: { id: answerId, qcmId: questionId },
      select: { id: true, position: true },
    });
    if (!answer) {
      return { status: "error", message: "Answer not found" };
    }

    await prisma.$transaction([
      prisma.qcmAnswer.delete({ where: { id: answer.id } }),
      prisma.qcmAnswer.updateMany({
        where: { qcmId: questionId, position: { gt: answer.position } },
        data: { position: { decrement: 1 } },
      }),
    ]);

    revalidatePath(`/admin/quizzes/${quizId}/edit/${coursId}`);
    return { status: "success", message: "Answer deleted successfully" };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Failed to delete answer" };
  }
};

// ------------------------------------------------------------------
// Delete question (QCM) and renumber its siblings within the same cours
// ------------------------------------------------------------------
export const deleteQuestion = async (
  questionId: string,
  quizId: string
): Promise<ApiResponse> => {
  await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, { fingerprint: quizId });
    if (decision.isDenied()) {
      return { status: "error", message: "Request denied" };
    }

    // Find the question and its cours, verify cours belongs to quiz
    const qcm = await prisma.qcm.findFirst({
      where: { id: questionId, cours: { quizId } },
      select: { id: true, position: true, coursId: true },
    });
    if (!qcm) {
      return { status: "error", message: "Question not found" };
    }

    // Siblings in same cours
    const siblings = await prisma.qcm.findMany({
      where: { coursId: qcm.coursId },
      orderBy: { position: "asc" },
      select: { id: true, position: true },
    });
    const coursId = qcm.coursId;

    const remaining = siblings.filter((s) => s.id !== questionId);

    await prisma.$transaction([
      ...remaining.map((s, idx) =>
        prisma.qcm.update({
          where: { id: s.id },
          data: { position: idx + 1 },
        })
      ),
      prisma.qcm.delete({ where: { id: questionId } }),
    ]);

    revalidatePath(`/admin/quizzes/${quizId}/edit/${coursId}`);
    return { status: "success", message: "Question deleted successfully" };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Failed to delete question" };
  }
};

// ------------------------------------------------------------------
// Add a cours to a quiz
// ------------------------------------------------------------------
export async function addCoursQuiz(values: {
  title: string;
  quizId: string;
}): Promise<ApiResponse> {
  await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, { fingerprint: values.quizId });
    if (decision.isDenied()) {
      return { status: "error", message: "Request denied" };
    }

    const cours = await prisma.cours.create({
      data: {
        title: values.title,
        quizId: values.quizId,
      },
    });

    revalidatePath(`/admin/quizzes/${values.quizId}/edit`);
    return {
      status: "success",
      message: "Course created successfully",
    };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Failed to create course" };
  }
}
export const updateAnswer = async (
  coursId: string,
  answerId: string,
  values: answerSchemaType
): Promise<ApiResponse> => {
  await requireAdmin();

  const parsed = answerSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Invalid answer data" };
  }

  const { quizId, questionId, text, isCorrect } = parsed.data;

  try {
    const req = await request();
    const decision = await aj2.protect(req, { fingerprint: quizId });
    if (decision.isDenied()) {
      return { status: "error", message: "Request denied" };
    }

    await prisma.$transaction(async (tx) => {
      // Ensure the QCM belongs to this quiz
      const qcm = await tx.qcm.findFirst({
        where: { id: questionId, cours: { quizId } },
        select: { id: true },
      });
      if (!qcm) throw new Error("QCM not found for this quiz");

      // Ensure the answer belongs to that QCM
      const ans = await tx.qcmAnswer.findFirst({
        where: { id: answerId, qcmId: questionId },
        select: { id: true },
      });
      if (!ans) throw new Error("Answer not found");

      await tx.qcmAnswer.update({
        where: { id: answerId },
        data: { text, isCorrect },
      });
    });

    revalidatePath(`/admin/quizzes/${quizId}/edit/${coursId}`);
    return { status: "success", message: "Answer updated successfully" };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "Failed to update answer" };
  }
};
