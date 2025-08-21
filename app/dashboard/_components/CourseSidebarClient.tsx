"use client";

import { CourseSidebarType } from "@/app/data/course/get-course-sidebar";
import dynamic from "next/dynamic";
const CourseSidebar = dynamic(() => import("./CourseSidebar"), {
  ssr: false,
});
interface CourseSidebarProps {
  course: CourseSidebarType["course"];
  userId: string;
}

const CourseSidebarClient = ({ course, userId }: CourseSidebarProps) => {
  return (
    <CourseSidebar course={course} userId={userId} /> // Use the dynamic component here
  );
};

export default CourseSidebarClient;
