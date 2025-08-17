import { ReactNode } from "react";
import CourseSidebar from "../_components/CourseSidebar";
import { getCourseSidebar } from "@/app/data/course/get-course-sidebar";
import { requireUser } from "@/app/data/user/require-user";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

const layout = async ({ children, params }: LayoutProps) => {
  const { slug } = await params;
  const course = await getCourseSidebar(slug);
  const session = await requireUser();
  return (
    <div className="flex flex-1">
      <div className="w-80 border-r border-border shrink-0">
        <CourseSidebar userId={session.user.id} course={course.course} />
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default layout;
