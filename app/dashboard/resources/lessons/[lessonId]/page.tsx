// app/lessons/[lessonId]/page.tsx
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

type Props = { params: Promise<{ lessonId: string }> };

export default async function Page({ params }: Props) {
  const { lessonId } = await params;
  const resources = await getResourcesForLesson(lessonId);
  const res = resources?.[0];

  const videosCount = res?.videos?.length ?? 0;
  const pdfsCount = res?.pdfs?.length ?? 0;
  const linksCount = res?.links?.length ?? 0;
  const modelsCount = res?.models3d?.length ?? 0;

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/40">
      <div className="container mx-auto max-w-6xl py-8 md:py-10">
        <h1 className="mb-2 text-center text-2xl font-semibold md:text-3xl">
          {res?.title ?? "Lesson"}
        </h1>
        {res?.description ? (
          <p className="mb-6 text-center text-sm text-muted-foreground md:mb-8">
            {res.description}
          </p>
        ) : (
          <div className="mb-6" />
        )}

        <Tabs defaultValue="videos" className="w-full">
          {/* Segmented-control header (mobile scroll + desktop grid) */}
          <div className="sticky top-0 z-20 -mx-4 mb-4 bg-gradient-to-b from-background/95 to-background/70 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:-mx-0 md:rounded-xl md:border md:bg-background/70">
            <TabsList
              aria-label="Lesson resources"
              className="
                flex w-full gap-2 overflow-x-auto rounded-2xl border border-border/60 bg-card/60 p-1 shadow-sm
                sm:grid sm:grid-cols-4 sm:gap-0 sm:overflow-visible
              "
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <TabsTrigger
                value="videos"
                className="
                  group inline-flex min-w-[9.5rem] items-center justify-center gap-2 rounded-xl
                  px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all
                  data-[state=active]:bg-background data-[state=active]:text-foreground
                  data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/50
                  hover:text-foreground hover:bg-background/60 sm:min-w-0
                "
              >
                <IconVideo className="size-4 shrink-0" />
                <span className="shrink-0">Videos</span>
                <span
                  className="
                    grid h-5 w-5 place-items-center rounded-full text-[10px]
                    bg-muted-foreground/10 text-foreground
                    group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary
                  "
                >
                  {videosCount}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="pdfs"
                className="
                  group inline-flex min-w-[9.5rem] items-center justify-center gap-2 rounded-xl
                  px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all
                  data-[state=active]:bg-background data-[state=active]:text-foreground
                  data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/50
                  hover:text-foreground hover:bg-background/60 sm:min-w-0
                "
              >
                <IconFileTypePdf className="size-4 shrink-0" />
                <span className="shrink-0">PDFs</span>
                <span
                  className="
                    grid h-5 w-5 place-items-center rounded-full text-[10px]
                    bg-muted-foreground/10 text-foreground
                    group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary
                  "
                >
                  {pdfsCount}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="links"
                className="
                  group inline-flex min-w-[9.5rem] items-center justify-center gap-2 rounded-xl
                  px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all
                  data-[state=active]:bg-background data-[state=active]:text-foreground
                  data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/50
                  hover:text-foreground hover:bg-background/60 sm:min-w-0
                "
              >
                <IconExternalLink className="size-4 shrink-0" />
                <span className="shrink-0">Links</span>
                <span
                  className="
                    grid h-5 w-5 place-items-center rounded-full text-[10px]
                    bg-muted-foreground/10 text-foreground
                    group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary
                  "
                >
                  {linksCount}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="models"
                className="
                  group inline-flex min-w-[9.5rem] items-center justify-center gap-2 rounded-xl
                  px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all
                  data-[state=active]:bg-background data-[state=active]:text-foreground
                  data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/50
                  hover:text-foreground hover:bg-background/60 sm:min-w-0
                "
              >
                <IconCube3dSphere className="size-4 shrink-0" />
                <span className="shrink-0">3D Models</span>
                <span
                  className="
                    grid h-5 w-5 place-items-center rounded-full text-[10px]
                    bg-muted-foreground/10 text-foreground
                    group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary
                  "
                >
                  {modelsCount}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* CONTENT */}
          <TabsContent value="videos" className="mt-0">
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
              {videosCount === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No videos yet.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pdfs" className="mt-0">
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
                      className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                    >
                      Open <IconExternalLink className="size-4" />
                    </a>
                  </CardContent>
                </Card>
              ))}
              {pdfsCount === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No PDFs yet.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="links" className="mt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                    >
                      Open <IconExternalLink className="size-4" />
                    </a>
                  </CardContent>
                </Card>
              ))}
              {linksCount === 0 && (
                <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                  No links yet.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="models" className="mt-0">
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
              {modelsCount === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No 3D models yet.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
