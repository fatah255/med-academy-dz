"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

import Link from "next/link";

const features = [
  {
    title: "Comprehensive Courses",
    description:
      "Access a wide range of courses designed by experts in the field.",
    Icon: "📘",
  },
  {
    title: "Interactive Learning",
    description:
      "Engage with interactive content that makes learning fun and effective.",
    Icon: "📚",
  },
  {
    title: "Progress Tracking",
    description: "Track your learning progress with our intuitive dashboard.",
    Icon: "📈",
  },
  {
    title: "Community Support",
    description:
      "Join a vibrant community of learners and get support when you need it.",
    Icon: "🤝",
  },
];

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  return (
    <>
      <section className="relative py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <Badge variant={"outline"}> The future of online education</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Elevate Your Learning Experience
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Discover a new way to learn to learn with our modern, interactive
            learning management system. Access high-quality courses anytime,
            anywhere
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {!session && (
              <Link
                href="/login"
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                })}
              >
                Sign in
              </Link>
            )}
            <Link
              href="/courses"
              className={buttonVariants({
                size: "lg",
                variant: "default",
              })}
            >
              Explore courses
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="text-4xl mb-4">{feature.Icon}</div>
              <CardTitle className="text-lg font-semibold">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
