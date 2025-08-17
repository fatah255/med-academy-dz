import { ReactNode } from "react";
import CourseSidebar from "../_components/CourseSidebar";
import { getCourseSidebar } from "@/app/data/course/get-course-sidebar";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

const layout = async ({ children, params }: LayoutProps) => {
  const { slug } = await params;
  const course = await getCourseSidebar(slug);
  return (
    <div className="flex flex-1">
      <div className="w-80 border-r border-border shrink-0">
        <CourseSidebar course={course.course} />
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default layout;
