import { PublicQuizType } from "@/app/data/quiz/get-all-quizzes";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useConstructUrl from "@/hooks/use-construct-url";
import { BookAIcon, DollarSignIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const PublicQuizCard = ({ course }: { course: PublicQuizType }) => {
  const level = course.level.split("_").join(" ").toLowerCase();
  const thumbnailUrl = useConstructUrl(course.fileKey);
  return (
    <Card className="group relative py-0 gap-0">
      <Badge className="absolute top-2 right-2 z-10 p-2 font-medium">
        {level}
      </Badge>
      <Image
        className="w-full rounded-t-xl h-full aspect-video object-cover"
        src={thumbnailUrl}
        alt="cover image"
        width={600}
        height={400}
      />
      <CardContent className="p-4">
        <Link
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
          href={`/quizzes/${course.slug}`}
        >
          {course.title}
        </Link>

        <div className="mt-4 flex items-center gap-x-5">
          <div className="flex items-center gap-x-2">
            <BookAIcon className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <p className="text-sm text-muted-foreground">{course.category}</p>
          </div>
          {course.price === 0 && (
            <div className="flex items-center gap-x-2">
              <DollarSignIcon className="size-6 p-1 rounded-md text-primary bg-primary/10" />
              <p className="text-sm text-muted-foreground">FREE</p>
            </div>
          )}
        </div>
        <Link
          className={buttonVariants({ className: "mt-4 w-full" })}
          href={`/quizzes/${course.slug}`}
        >
          Learn More
        </Link>
      </CardContent>
    </Card>
  );
};
export default PublicQuizCard;

export function PublicCourseCardSkeleton() {
  return (
    <Card className="group relative py-0 gap-0">
      <div className="absolute top-2 right-2 z-10 p-2 font-medium flex items-center">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="w-full h-fit relative">
        <Skeleton className="rounded-t-xl w-full aspect-video" />
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
