"use server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateExam(
  examId: string,
  values: {
    module: string;
  }
) {
  try {
    const exam = await prisma.exams.update({
      where: { id: examId },
      data: {
        category: values.module,
      },
    });
    revalidatePath(`/admin/editExams/${exam.level}`);
    return { status: "success", message: "Exam updated successfully" };
  } catch (e) {
    console.log(e);
    return { status: "error", message: "Failed to update exam" };
  }
}
