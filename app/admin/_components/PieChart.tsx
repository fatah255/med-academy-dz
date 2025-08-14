"use client";

import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "platform users infos";

const chartConfig = {
  visitors: {
    label: "Users",
  },
  enrolled: {
    label: "Enrolled Users",
    color: "var(--primary)",
  },

  notEnrolled: {
    label: "Not Enrolled Users",
    color: "var(--primary-foreground)",
  },
} satisfies ChartConfig;

export function ChartPieSeparatorNone({
  enrolled,
  notEnrolled,
}: {
  enrolled: number;
  notEnrolled: number;
}) {
  const chartData = [
    { info: "Enrolled users", number: enrolled, fill: "var(--primary)" },
    {
      info: "not enrolled users",
      number: notEnrolled,
      fill: "var(--primary-foreground)",
    },
  ];
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart for users infos</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie data={chartData} dataKey="number" nameKey="info" stroke="0" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="text-muted-foreground leading-none">
          Showing total Enrolled and Not Enrolled users
        </div>
      </CardFooter>
    </Card>
  );
}
