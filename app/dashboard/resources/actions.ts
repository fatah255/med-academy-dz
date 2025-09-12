import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";

export async function getUnitesForLevel(
  level:
    | "FIRST_YEAR"
    | "SECOND_YEAR"
    | "THIRD_YEAR"
    | "FOURTH_YEAR"
    | "FIFTH_YEAR"
    | "SIXTH_YEAR"
) {
  if (level === "FIRST_YEAR") {
    return [];
  }
  const units = await prisma.unites.findMany({
    where: {
      level: level,
    },
    select: {
      id: true,
      title: true,
      description: true,
    },
  });
  return units;
}

export async function getModules(
  level:
    | "FIRST_YEAR"
    | "SECOND_YEAR"
    | "THIRD_YEAR"
    | "FOURTH_YEAR"
    | "FIFTH_YEAR"
    | "SIXTH_YEAR"
) {
  const modules = await prisma.modules.findMany({
    where: {
      level: level,
      uniteId: null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      icon: true,
    },
  });
  return modules;
}

export async function getModulesForUnit(unitId: string) {
  await requireUser();
  const modules = await prisma.modules.findMany({
    where: {
      uniteId: unitId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      icon: true,
    },
  });
  return modules;
}

export async function getLessonsForModule(moduleId: string) {
  await requireUser();
  const lessons = await prisma.resources.findMany({
    where: {
      moduleId: moduleId,
    },
    select: {
      id: true,
      title: true,
      description: true,
    },
  });
  return lessons;
}

export async function getResourcesForLesson(lessonId: string) {
  await requireUser();
  const resources = await prisma.resources.findMany({
    where: {
      id: lessonId,
    },
    select: {
      id: true,
      title: true,
      description: true,

      videos: {
        select: {
          id: true,
          title: true,
          url: true,
        },
      },
      links: {
        select: {
          id: true,
          title: true,
          url: true,
        },
      },
      pdfs: {
        select: {
          id: true,
          title: true,
          url: true,
        },
      },
      models3d: {
        select: {
          id: true,
          title: true,
          url: true,
        },
      },
    },
  });
  return resources;
}
