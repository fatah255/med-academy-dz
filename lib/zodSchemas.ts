import z from "zod";
export const courseLevels = [
  "FIRST_YEAR",
  "SECOND_YEAR",
  "THIRD_YEAR",
  "FOURTH_YEAR",
  "FIFTH_YEAR",
  "SIXTH_YEAR",
] as const;
export const courseStatus = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const courseSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long." })
    .max(100, { message: "Title must not exceed 100 characters." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long." })
    .max(500, { message: "Description must not exceed 500 characters." }),
  fileKey: z.string().min(1, { message: "File key is required." }),
  price: z.coerce.number().min(1, { message: "Price is required." }),
  duration: z.coerce
    .number()
    .min(1, { message: "Duration is required" })
    .max(500, { message: "Duration must not exceed 500 hours" }),
  level: z.enum(courseLevels),
  category: z.string().min(1, { message: "Category is required." }),
  smallDescription: z
    .string()
    .min(3, {
      message: "Small description must be at least 3 characters long.",
    })
    .max(200, { message: "Small description must not exceed 200 characters." }),
  slug: z
    .string()
    .min(3, { message: "Slug must be at least 3 characters long." })
    .max(100, { message: "Slug must not exceed 100 characters." }),
  status: z.enum(courseStatus),
});

export const chapterSchema = z.object({
  name: z.string().min(3, { message: "Chapter name is required." }),
  courseId: z.string().uuid({ message: "Invalid course ID." }),
});

export const lessonSchema = z.object({
  name: z.string().min(3, { message: "Lesson name is required." }),
  courseId: z.string().uuid({ message: "Invalid course ID." }),
  chapterId: z.string().uuid({ message: "Invalid chapter ID." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long." })
    .optional(),
  thumbnailKey: z.string().optional(),
  videoKey: z.string().optional(),
});

export const settingsSchema = z.object({
  year: z.enum(courseLevels),
});

/** One answer row (no id on create) */
export const qcmAnswerCreateSchema = z.object({
  text: z.string().trim().min(1, "Answer text is required").max(500),
  isCorrect: z.boolean().default(false),
  // if you receive strings from forms, use z.coerce.number()
  order: z.coerce.number().int().min(1, "Order must be >= 1"),
});

/** Full create */
export const qcmCreateSchema = z.object({
  question: z.string().trim().min(5).max(1000),
  answers: z
    .array(qcmAnswerCreateSchema)
    .min(2, "At least two answers")
    .max(4, "At most four answers") // adjust if you allow more than A–D
    .superRefine((answers, ctx) => {
      // must have at least one correct
      if (!answers.some((a) => a.isCorrect)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one answer must be correct",
          path: ["answers"],
        });
      }
      // no duplicate order values
      const seen = new Set<number>();
      answers.forEach((a, i) => {
        if (seen.has(a.order)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate order: ${a.order}`,
            path: ["answers", i, "order"],
          });
        }
        seen.add(a.order);
      });
    }),
});

/** Update: replace-all strategy (simplest) */
export const qcmUpdateSchema = z.object({
  id: z.string().uuid(),
  question: z.string().trim().min(5).max(1000).optional(),
  // optional: if provided, you'll replace the whole answers set
  answers: z
    .array(qcmAnswerCreateSchema) // same shape as create (we recreate rows)
    .min(2)
    .max(4)
    .optional()
    .superRefine((answers, ctx) => {
      if (!answers) return;
      if (!answers.some((a) => a.isCorrect)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one answer must be correct",
          path: ["answers"],
        });
      }
      const seen = new Set<number>();
      answers.forEach((a, i) => {
        if (seen.has(a.order)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate order: ${a.order}`,
            path: ["answers", i, "order"],
          });
        }
        seen.add(a.order);
      });
    }),
});

export type QcmCreateInput = z.infer<typeof qcmCreateSchema>;

export type courseSchemaType = z.infer<typeof courseSchema>;
export type chapterSchemaType = z.infer<typeof chapterSchema>;
export type lessonSchemaType = z.infer<typeof lessonSchema>;
export type settingsSchemaType = z.infer<typeof settingsSchema>;
