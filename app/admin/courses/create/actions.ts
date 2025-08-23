"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";

import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { courseSchema, courseSchemaType } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";

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
export const createCourse = async (
  data: courseSchemaType
): Promise<ApiResponse> => {
  const session = await requireAdmin();
  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session?.user.id || "",
    });
    if (decision.isDenied()) {
      return {
        status: "error",
        message: "Request denied",
      };
    }

    const validation = courseSchema.safeParse(data);


    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid form data",
      };
    }

   await prisma.course.create({
      data: {
        ...validation.data,
        userId: session?.user.id || "",
      },
    });
    return {
      status: "success",
      message: "Course created successfully",
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Failed to create course",
    };
  }
};
