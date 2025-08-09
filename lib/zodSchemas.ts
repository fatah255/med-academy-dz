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

export type courseSchemaType = z.infer<typeof courseSchema>;
export type chapterSchemaType = z.infer<typeof chapterSchema>;
export type lessonSchemaType = z.infer<typeof lessonSchema>;
