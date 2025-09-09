// app/ngl/admin/page.tsx  (Server Component)
import { requireAdmin } from "@/app/data/admin/require-admin";
import { listMyNglMessages, ensureMyNglLink } from "@/app/ngl/actions";
import { formatDistanceToNow } from "date-fns";
import ShareLink from "./ShareLink";
import ImagePview from "./imagePview";

export default async function Page() {
  await requireAdmin();

  const [items, code] = await Promise.all([
    listMyNglMessages(),
    ensureMyNglLink(),
  ]);

  const shareUrl = `${process.env.BETTER_AUTH_URL ?? ""}/ngl/${code}`;

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Anonymous inbox</h1>
        <ShareLink url={shareUrl} />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((m) => (
            <li key={m.id} className="rounded border p-3">
              <div className="mb-1 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(m.createdAt), {
                  addSuffix: true,
                })}
              </div>
              <p className="whitespace-pre-wrap">{m.content}</p>
              <ImagePview fileKey={m.fileKey} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
