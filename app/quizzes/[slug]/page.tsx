import { getCourse } from "@/app/data/course/get-course";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import useConstructUrl from "@/hooks/use-construct-url";

import { Book, Check, School, TimerIcon } from "lucide-react";
import Image from "next/image";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IconAbc,
  IconBook,
  IconChevronDown,
  IconClock,
  IconPlayerPlay,
  IconQuestionMark,
  IconSchool,
  IconWriting,
} from "@tabler/icons-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { userIsEnrolled } from "@/app/data/user/user-is-enrolled";
import Link from "next/link";

import { getQuiz } from "@/app/data/quiz/get-quiz";
import Description from "@/app/courses/[slug]/Description";
import EnrollementQuizButton from "@/app/quizzes/[slug]/EnrollmentQuizButton";
import { userIsEnrolledQuiz } from "@/app/data/user/user-is-enrolled-quiz";

type Params = Promise<{
  slug: string;
}>;

const page = async ({ params }: { params: Params }) => {
  const { slug } = await params;
  const course = await getQuiz(slug);
  const thumbnailUrl = useConstructUrl(course.fileKey);
  const isEnrolled = await userIsEnrolledQuiz(course.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-9 mt-5">
      <div className="order-1 lg:col-span-2">
        <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-lg">
          <Image
            src={thumbnailUrl}
            alt="Course Image"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex items-center justify-center"></div>
        </div>
        <div className="mt-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl tracking-tight font-bold">
              {course.title}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg leading-relaxed line-clamp-2"></p>
            <div className="flex flex-wrap gap-2">
              <Badge className="flex items-center gap-1 px-3 py-1">
                <School className="size-4 " />
                {course.level.split("_").join(" ").toLowerCase()}
              </Badge>
              <Badge className="flex items-center gap-1 px-3 py-1">
                <Book className="size-4 " />
                {course.category}
              </Badge>
            </div>
          </div>
          <Separator className="my-8 w-2/3 h-1" />
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold tracking-tight">
              Quiz Description
            </h2>

            <Description description={course.description} />
          </div>
        </div>
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold tracking-tight">
              Quiz Content
            </h2>
            <div>{course.qcm.length} QCMs</div>
          </div>
        </div>
      </div>

      <div className="order-2 lg:col-span-1 ">
        <div className="sticky top-20">
          <Card className="py-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <span>Price: </span>
                <span className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "DZD",
                  }).format(course.price)}
                </span>
              </div>
              <div className="space-y-4 mb-6 rounded-lg bg-muted p-4">
                <h4 className="font-medium">What you will get</h4>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconSchool className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Quiz's Year</p>
                      <p className="text-sm text-muted-foreground">
                        {course.level.split("_").join(" ").toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconBook className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Module</p>
                      <p className="text-sm text-muted-foreground">
                        {course.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconQuestionMark className="size-4" />
                    </div>
                    <p className="text-sm font-medium">
                      {course.qcm.length} QCMs
                    </p>
                  </div>
                </div>
              </div>
              <div className="mb-6 space-y-3">
                <h4>This Course</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm ">
                    <div className="rounded-full bg-green-500/10 text-green-700 p-1">
                      <Check className="size-3" />
                    </div>
                    <span>Full Lifetime Access</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm ">
                    <div className="rounded-full bg-green-500/10 text-green-700 p-1">
                      <Check className="size-3" />
                    </div>
                    <span>test you knowledge with the best way</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm ">
                    <div className="rounded-full bg-green-500/10 text-green-700 p-1">
                      <Check className="size-3" />
                    </div>
                    <span>updated quizzes</span>
                  </li>
                </ul>
              </div>
              {isEnrolled ? (
                <>
                  <Link
                    href={`/dashboard`}
                    className={buttonVariants({
                      className: "w-full font-bold text-lg cursor-pointer",
                    })}
                  >
                    Study Now !
                  </Link>
                </>
              ) : (
                <>
                  <EnrollementQuizButton courseId={course.id} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default page;
