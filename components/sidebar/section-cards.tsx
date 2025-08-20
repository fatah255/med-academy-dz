import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  countNewUsersLastMonth,
  countTotalUsers,
  countUsersWithAtLeastOnePaidEnrollment,
  countUsersWithAtLeastOnePaidEnrollmentCalendarLastMonth,
  getQuizRevenueLast30Days,
  totalCourses,
  totalRevenueCalendarLastMonthFromCoursePrice,
  totalRevenueLast30Days,
  totalRevenueLast30DaysUser,
} from "@/app/admin/actions";
import { PlusIcon } from "lucide-react";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { Separator } from "../ui/separator";

export async function SectionCards({ email }: { email?: string }) {
  await requireAdmin();
  const { published, draft, archived } = await totalCourses();
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total SignUps</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {await countTotalUsers()}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <p className="text-muted-foreground">
            Registered users in the platform{" "}
          </p>
          <div className="line-clamp-1 flex gap-2 font-medium">
            + {await countNewUsersLastMonth()} in the last month
          </div>
        </CardFooter>
      </Card>
      {(email === "a.lebkara@esi-sba.dz" ||
        email === "abdouzerguine897@gmail.com") && (
        <Card className="@container/card ">
          <CardHeader>
            <CardDescription>
              Total Revenues for the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl mt-2">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "DZD",
            }).format(await totalRevenueLast30Days())}
          </CardContent>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground">
              the revenue from quizzes is:{" "}
            </p>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "DZD",
            }).format(await getQuizRevenueLast30Days())}
          </CardFooter>
        </Card>
      )}
      <Card className="@container/card ">
        <CardHeader>
          <CardDescription>
            Total Revenues for your courses in the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl mt-2">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "DZD",
          }).format(await totalRevenueLast30DaysUser())}
          <p> </p>
        </CardContent>
      </Card>
      {(email === "a.lebkara@esi-sba.dz" ||
        email === "abdouzerguine897@gmail.com") && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Courses</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{published} Published courses</p>
            <p>{draft} Draft courses</p>
            <p>{archived} Archived courses</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
