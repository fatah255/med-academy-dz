import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getResourcesForLesson } from "../../actions";
import SmoothTabsClient from "./_components/SmoothTabsClient";

type Props = { params: Promise<{ lessonId: string }> };

export default async function Page({ params }: Props) {
  const { lessonId } = await params;
  const resources = await getResourcesForLesson(lessonId);
  const res = resources?.[0];

  // Prepare plain serializable data for the client wrapper
  const videos = (res?.videos ?? []).map((v) => ({
    id: v.id,
    title: v.title,
    url: v.url,
  }));
  const pdfs = (res?.pdfs ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    url: p.url,
  }));
  const links = (res?.links ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    url: l.url,
  }));
  const models = (res?.models3d ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    url: m.url,
  }));

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/40">
      <div className="container mx-auto max-w-6xl py-8 md:py-10">
        <h1 className="mb-2 text-center text-2xl font-semibold md:text-3xl">
          {res?.title ?? "Lesson"}
        </h1>
        {res?.description && (
          <p className="mb-6 text-center text-sm text-muted-foreground md:mb-8">
            {res.description}
          </p>
        )}

        {/* ✅ Client wrapper builds Kokonut tabs & React content */}
        <SmoothTabsClient
          videos={videos}
          pdfs={pdfs}
          links={links}
          models={models}
          className="mt-2"
        />
      </div>
    </div>
  );
}
