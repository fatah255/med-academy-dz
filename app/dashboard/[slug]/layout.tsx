
import { ReactNode } from "react";
import { getCourseSidebar } from "@/app/data/course/get-course-sidebar";
import { requireUser } from "@/app/data/user/require-user";
import MobileSyllabusSheet from "./[lessonId]/_components/MobileSyllabusSheet";
import CourseSidebarClient from "../_components/CourseSidebarClient";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

const layout = async ({ children, params }: LayoutProps) => {
  const { slug } = await params;
  const { course } = await getCourseSidebar(slug);
  const session = await requireUser();

  // Prepare the server component element ON THE SERVER
  const sidebarEl = (
    <CourseSidebarClient userId={session.user.id} course={course} />
  );

  return (
    <div className="flex min-h-[calc(100dvh-0px)]">
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block w-80 shrink-0 border-r border-border">
        {sidebarEl}
      </aside>

      <div className="flex-1 flex flex-col min-w-0  ml-2">
        {/* Mobile top bar with drawer trigger */}
        <div className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-3 px-4 py-2">
            <MobileSyllabusSheet title={course.title}>
              {/* Pass server element as children to client wrapper */}
              {sidebarEl}
            </MobileSyllabusSheet>
            <div className="font-medium truncate">{course.title}</div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default layout;
