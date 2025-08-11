import { getCourse } from "@/app/data/course/get-course";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import useConstructUrl from "@/hooks/use-construct-url";

import { Book, School, TimerIcon } from "lucide-react";
import Image from "next/image";
import Description from "./Description";

type Params = Promise<{
  slug: string;
}>;

const page = async ({ params }: { params: Params }) => {
  const { slug } = await params;
  const course = await getCourse(slug);
  const thumbnailUrl = useConstructUrl(course.fileKey);
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
        <div className="mt-12"></div>
      </div>
    </div>
  );
};

export default page;
