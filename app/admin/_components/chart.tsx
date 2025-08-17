"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const chartConfig = {
  enrollments: {
    label: "Enrollments",
    color: "#2563eb",
  },
} satisfies ChartConfig;

export function EnrollmentsChart({
  data,
}: {
  data: {
    course: string;
    enrollments: number;
  }[];
}) {
  console.log(data);
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="course"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.substring(0, 10)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="enrollments" fill="var(--primary)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
