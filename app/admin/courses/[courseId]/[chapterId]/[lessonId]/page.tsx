import { getLesson } from "@/app/data/admin/admin-get-lesson";
import LessonForm from "./_components/LessonForm";

type Params = Promise<{
  courseId: string;
  chapterId: string;
  lessonId: string;
}>;

const LessonPage = async ({ params }: { params: Params }) => {
  const { courseId, chapterId, lessonId } = await params;

  const lesson = await getLesson(lessonId);
  return <LessonForm data={lesson} chapterId={chapterId} courseId={courseId} />;
};

export default LessonPage;
