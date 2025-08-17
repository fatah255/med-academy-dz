import { getLessonContent } from "@/app/data/course/get-lesson-content";
import CourseContent from "./_components/CourseContent";

type Params = Promise<{ lessonId: string }>;
interface PageProps {
  params: Params;
}
const page = async ({ params }: PageProps) => {
  const { lessonId } = await params;
  const lesson = await getLessonContent(lessonId);
  return <CourseContent lesson={lesson} />; // Render the lesson content component with the fetched lesson data
};

export default page;
