import TldrawClient from "./_components/TldrawClient";

export default async function Page({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;
  return <TldrawClient noteId={noteId} />;
}
