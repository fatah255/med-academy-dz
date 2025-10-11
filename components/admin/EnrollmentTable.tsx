"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

type Enrollment = {
  id: string;
  amount: number;
  status: string;
  transactionId?: string | null;
  user: { name?: string | null; email: string };
  course?: { title: string | null; slug: string | null } | null;
  quiz?: { title: string | null } | null;
  offer: boolean;
  isOffer: boolean;
  ai: boolean;
  billingPeriod?: string | null;
  createdAt: string;
  paidAt?: string | null;
  expiresAt?: string | null;
};

export function EnrollmentTable({
  enrollments,
}: {
  enrollments: Enrollment[];
}) {
  const rowRevenue = (e: Enrollment) => (e.amount >= 900 ? 400 : 300);
  const totalRevenue = enrollments.reduce((sum, e) => sum + rowRevenue(e), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollments</CardTitle>
      </CardHeader>
      <CardContent>
        <Separator className="mb-4" />
        <ScrollArea className="max-h-[600px] rounded-md border">
          <Table>
            <TableCaption>List of all enrollments</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Course / Quiz</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>boubouat fayda</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No enrollments found.
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{e?.user?.name || "—"}</span>
                        <span className="text-xs text-muted-foreground">
                          {e?.user?.email}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {e.course ? (
                        <div className="flex flex-col">
                          <span>{e.course.title || "—"}</span>
                          <span className="text-xs text-muted-foreground">
                            {e.course.slug}
                          </span>
                        </div>
                      ) : e.quiz ? (
                        <span>{e.quiz.title}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell>
                      {e.status === "PAID" ? (
                        <Badge variant="default">PAID</Badge>
                      ) : e.status === "PENDING" ? (
                        <Badge variant="secondary">PENDING</Badge>
                      ) : (
                        <Badge variant="outline">{e.status}</Badge>
                      )}
                    </TableCell>

                    <TableCell className="tabular-nums">{e.amount}</TableCell>

                    <TableCell className="tabular-nums">
                      {rowRevenue(e)}
                    </TableCell>

                    <TableCell>
                      {format(new Date(e.createdAt), "yyyy-MM-dd")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  Total boubouat revenue
                </TableCell>
                <TableCell className="font-bold tabular-nums">
                  {totalRevenue}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
