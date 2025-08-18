import { adminGetCourse } from "@/app/data/admin/admin-get-course";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { adminGetQuiz } from "@/app/data/admin/admin-get-quiz";
import EditQuizForm from "./_components/EditQuizForm";
import QuizStructure from "./_components/QuizStructure";

type Params = Promise<{ quizId: string }>;

const page = async ({ params }: { params: Params }) => {
  const { quizId } = await params;
  const data = await adminGetQuiz(quizId);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Edit quiz : <span className="text-primary underline">{data.title}</span>{" "}
      </h1>
      <Tabs defaultValue="basic-info" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
          <TabsTrigger value="course-structure">Course Structure</TabsTrigger>
        </TabsList>
        <TabsContent value="basic-info">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Edit basic Information about the quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditQuizForm quiz={data} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="course-structure">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Structure</CardTitle>
              <CardDescription>Edit the structure of the quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <QuizStructure quiz={data} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default page;
