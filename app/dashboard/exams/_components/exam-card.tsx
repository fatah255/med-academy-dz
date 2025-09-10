// app/dashboard/exams/_components/exam-card.tsx
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

type Exam = {
  id: string;
  title: string;
  year: number;
  level: string;
  category: string;
  createdAt: Date;
};

export default function ExamCard({ exam }: { exam: Exam }) {
  return (
    <Card className="hover:shadow-sm transition">
      <CardHeader className="space-y-1">
        <CardTitle className="line-clamp-2 text-base">
          <Link
            href={`/dashboard/exams/${exam.id}`}
            className="hover:underline"
          >
            {exam.title}
          </Link>
        </CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{exam.category}</Badge>
          <Badge variant="secondary">Y{exam.year}</Badge>
          <Badge variant="outline">{exam.level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Link
          href={`/dashboard/exams/${exam.id}`}
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          <ClipboardList className="mr-1 h-4 w-4" />
          View exam
        </Link>
      </CardContent>
    </Card>
  );
}
