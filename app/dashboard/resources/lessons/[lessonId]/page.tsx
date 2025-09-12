// app/lessons/[lessonId]/page.tsx
import SectionHeader from "@/components/section-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  IconVideo,
  IconFileTypePdf,
  IconExternalLink,
  IconCube3dSphere,
} from "@tabler/icons-react";
import { getResourcesForLesson } from "../../actions";
import { YouTubePlayer } from "./_components/youtube-player";
import { PdfViewer } from "./_components/pdf-viewer";
import { SketchfabViewer } from "./_components/sketchfab-viewer";

// import { YouTubePlayer } from "@/components/ui/youtube-video-player";

type Props = { params: Promise<{ lessonId: string }> };

export default async function Page({ params }: Props) {
  const { lessonId } = await params;
  const resources = await getResourcesForLesson(lessonId);
  const res = resources?.[0]; // your query returns an array; pick first

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/40">
      <div className="container mx-auto max-w-6xl py-8 md:py-10">
        <h1 className="text-2xl md:text-3xl font-semibold text-center mb-2">
          {res?.title ?? "Lesson"}
        </h1>
        {res?.description ? (
          <p className="text-center text-sm text-muted-foreground mb-8">
            {res.description}
          </p>
        ) : (
          <div className="mb-6" />
        )}

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="videos" className="gap-2">
              <IconVideo className="size-4" /> Videos
              <Badge variant="secondary" className="ml-1">
                {res?.videos?.length ?? 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pdfs" className="gap-2">
              <IconFileTypePdf className="size-4" /> PDFs
              <Badge variant="secondary" className="ml-1">
                {res?.pdfs?.length ?? 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="links" className="gap-2">
              <IconExternalLink className="size-4" /> Links
              <Badge variant="secondary" className="ml-1">
                {res?.links?.length ?? 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <IconCube3dSphere className="size-4" /> 3D Models
              <Badge variant="secondary" className="ml-1">
                {res?.models3d?.length ?? 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="mt-4">
            {/* vertical list instead of 3-col grid */}
            <div className="flex flex-col gap-4">
              {(res?.videos ?? []).map((v) => (
                <Card key={v.id} className="border-muted/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{v.title}</CardTitle>
                    <CardDescription>Video</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <YouTubePlayer value={v.url} title={v.title} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pdfs" className="mt-4">
            <div className="flex flex-col gap-4">
              {(res?.pdfs ?? []).map((p) => (
                <Card key={p.id} className="border-muted/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <CardDescription>PDF</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <PdfViewer src={p.url} title={p.title} />
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline underline-offset-4"
                    >
                      Open <IconExternalLink className="size-4" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="links" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {(res?.links ?? []).map((l) => (
                <Card key={l.id} className="border-muted/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{l.title}</CardTitle>
                    <CardDescription>External Link</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={l.url}
                      target="_blank"
                      className="inline-flex items-center gap-2 text-primary hover:underline underline-offset-4"
                    >
                      Open <IconExternalLink className="size-4" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="models" className="mt-4">
            <div className="flex flex-col gap-4">
              {(res?.models3d ?? []).map((m) => (
                <Card key={m.id} className="border-muted/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <CardDescription>3D Model</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <SketchfabViewer url={m.url} title={m.title} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
