import { getLessonContent } from "@/app/data/course/get-lesson-content";
import CourseContent, {
  CourseContentSkeleton,
} from "./_components/CourseContent";
import { Suspense } from "react";

type Params = Promise<{ lessonId: string }>;
interface PageProps {
  params: Params;
}
const page = async ({ params }: PageProps) => {
  const { lessonId } = await params;
  return (
    <Suspense fallback={<CourseContentSkeleton />}>
      <CourseLoader lessonId={lessonId} />
    </Suspense>
  );
};

export default page;

const CourseLoader = async ({ lessonId }: { lessonId: string }) => {
  const lesson = await getLessonContent(lessonId);
  return <CourseContent lesson={lesson} />;
};
