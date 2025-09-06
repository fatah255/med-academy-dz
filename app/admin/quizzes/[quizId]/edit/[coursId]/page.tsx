import { adminGetQuiz } from "@/app/data/admin/admin-get-quiz";
import QuizStructure from "../_components/QuizStructure";

interface Params {
  quizId: string;
  coursId: string;
}

const Page = async ({ params }: { params: Promise<Params> }) => {
  const { quizId, coursId } = await params;
  const quiz = await adminGetQuiz(quizId);
  return <QuizStructure quiz={quiz} coursId={coursId} />;
};

export default Page;
