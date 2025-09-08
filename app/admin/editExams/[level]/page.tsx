import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import EditExamModal from "./_components/EditExamModal";
type Level =
  | "FIRST_YEAR"
  | "SECOND_YEAR"
  | "THIRD_YEAR"
  | "FOURTH_YEAR"
  | "FIFTH_YEAR"
  | "SIXTH_YEAR";

const Page = async ({ params }: { params: Promise<{ level: string }> }) => {
  const { level } = await params;

  const exams = await prisma.exams.findMany({
    where: {
      level: level as Level,
    },
    orderBy: {
      year: "desc",
    },
  });

  return (
    <div>
      {exams.map((exam) => (
        <Card key={exam.id} className="p-4 mb-4">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">{exam.title}</CardTitle>
            <EditExamModal
              module={exam.category}
              examId={exam.id}
              selectedYear={level as Level}
            />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

export default Page;
