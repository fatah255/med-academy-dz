import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { AdminCourseType } from "@/app/data/admin/admin-get-courses";
import useConstructUrl from "@/hooks/use-construct-url";
import Link from "next/link";
import {
  ArrowRight,
  BookCheck,
  Eye,
  MoreVertical,
  Pencil,
  School,
  TimerIcon,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminQuizType } from "@/app/data/admin/admin-get-quizzes";
import PreviewQuizModal from "./PreviewQuizModal";

const QuizCard = ({ quiz }: { quiz: AdminQuizType }) => {
  const level = quiz.level
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return (
    <Card className="group relative py-0 gap-0">
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/quizzes/${quiz.id}/delete`}>
                <Trash2 className="mr-2 text-destructive size-4" />
                Delete Quiz
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Image
        width={600}
        height={400}
        src={useConstructUrl(quiz.fileKey)}
        alt={quiz.title}
        className="w-full rounded-t-lg aspect-video h-full object-cover group-hover:opacity-80 transition-opacity duration-300"
      />
      <CardContent className="p-4 flex flex-col gap-2">
        <Link
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
          href={`/admin/quizzes/${quiz.id}/edit`}
        >
          {quiz.title}
        </Link>

        <div className="mt-4 flex items-center gap-x-5">
          <div className="flex items-center gap-x-2">
            <School className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <p className="text-sm text-muted-foreground">{`${level}`}</p>
          </div>
          <div className="flex items-center gap-x-2">
            <BookCheck className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <p className="text-sm text-muted-foreground">
              {`${quiz.category}`}
            </p>
          </div>
        </div>
        <Link
          href={`/admin/quizzes/${quiz.id}/edit`}
          className={buttonVariants({ className: "w-full mt-3" })}
        >
          Edit Quiz
          <ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
};

export default QuizCard;

export async function QuizCardSkeleton() {
  return (
    <Card className="group relative py-0 gap-0">
      <div className="absolute top-2 right-2 z-10 flex items-center justify-center">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="size-8 rounded-md" />
      </div>
      <div className="w-full h-fit relative">
        <Skeleton className="w-full rounded-t-lg aspect-video" />
      </div>
    </Card>
  );
}
