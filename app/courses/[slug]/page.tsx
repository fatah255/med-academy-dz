import { getCourse } from "@/app/data/course/get-course";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import useConstructUrl from "@/hooks/use-construct-url";

import { Book, Check, School, TimerIcon } from "lucide-react";
import Image from "next/image";
import Description from "./Description";
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
  IconBook,
  IconChevronDown,
  IconClock,
  IconPlayerPlay,
  IconSchool,
  IconWriting,
} from "@tabler/icons-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { userIsEnrolled } from "@/app/data/user/user-is-enrolled";
import Link from "next/link";

type Params = Promise<{
  slug: string;
}>;

const page = async ({ params }: { params: Params }) => {
  const { slug } = await params;
  const course = await getCourse(slug);
  const thumbnailUrl = useConstructUrl(course.fileKey);
  const isEnrolled = await userIsEnrolled(course.id);
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
            <p className="text-muted-foreground mt-2 text-lg leading-relaxed line-clamp-2">
              {course.smallDescription}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="flex items-center gap-1 px-3 py-1">
                <School className="size-4 " />
                {course.level.split("_").join(" ").toLowerCase()}
              </Badge>
              <Badge className="flex items-center gap-1 px-3 py-1">
                <Book className="size-4 " />
                {course.category}
              </Badge>
              <Badge className="flex items-center gap-1 px-3 py-1">
                <TimerIcon className="size-4 " />
                {course.duration} hours
              </Badge>
            </div>
          </div>
          <Separator className="my-8 w-2/3 h-1" />
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold tracking-tight">
              Course Description
            </h2>

            <Description description={course.description} />
          </div>
        </div>
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold tracking-tight">
              Course Content
            </h2>
            <div>
              {course.chapters.length} chapters |{" "}
              {course.chapters.reduce(
                (acc, chapter) => acc + chapter.lesson.length,
                0
              ) || 0}{" "}
              lessons
            </div>
          </div>
          <div className="space-y-4">
            {course.chapters.map((chapter, i) => (
              <Collapsible defaultOpen={i === 0} key={chapter.id}>
                <Card className="p-0 overflow-hidden border-2 transition-all duration-200 gap-0">
                  <CollapsibleTrigger>
                    <div>
                      <CardContent className="p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <p className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              {" "}
                              {i + 1}{" "}
                            </p>
                            <div>
                              <h3 className="text-xl font-semibold text-left">
                                {chapter.title}
                              </h3>
                              <p>
                                {chapter.lesson.length}{" "}
                                {chapter.lesson.length === 1
                                  ? "lesson"
                                  : "lessons"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="text-xs" variant="outline">
                              {chapter.lesson.length}{" "}
                              {chapter.lesson.length === 1
                                ? "lesson"
                                : "lessons"}
                            </Badge>
                            <IconChevronDown className="size-5 text-muted-foreground ml-0" />
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t bg-muted/20">
                      <div className="p-6 pt-4 space-3 ">
                        {chapter.lesson.map((lesson, lessonId) => (
                          <div
                            className="flex items-center gap-4 rounded-lg p-3 hover:bg-accent transition-colors cursor-pointer group"
                            key={lesson.id}
                          >
                            <div className="flex size-8 items-center justify-center rounded-full bg-background border-2 border-muted">
                              <IconPlayerPlay className="size-5 text-muted-foreground group-hover:text-primary transition-colors " />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm mt-1">
                                {lesson.title}
                              </p>
                              <p> lesson {lessonId + 1} </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
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
                      <IconClock className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Course Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {course.duration} hours
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconSchool className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Course's Year</p>
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
                      <IconWriting className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Course Content</p>
                      <p className="text-sm text-muted-foreground">
                        {course.chapters.reduce(
                          (acc, chapter) => acc + chapter.lesson.length,
                          0
                        ) || 0}{" "}
                        lessons
                      </p>
                    </div>
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
                    <span>study and practice</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm ">
                    <div className="rounded-full bg-green-500/10 text-green-700 p-1">
                      <Check className="size-3" />
                    </div>
                    <span>updated content</span>
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
                  <Button className="w-full font-bold text-lg cursor-pointer">
                    Enroll Now!{" "}
                  </Button>
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
