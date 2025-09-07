import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import Overlay from "./overlay";
import Actions from "./actions";
import Footer from "./Footer";
import { Skeleton } from "@/components/ui/skeleton";

interface NoteCardProps {
  id: string;
  title: string;
  createdAt: Date | number | string;
  imageUrl?: string | null;
}

const NoteCard = ({ id, title, imageUrl, createdAt }: NoteCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <Link href={`/dashboard/notes/${id}`} className="block">
      <div
        className="
          group relative aspect-[3/4] w-40 sm:w-44 rounded-xl overflow-hidden
          border bg-card shadow-sm transition-all
          hover:-translate-y-0.5 hover:shadow-md
        "
      >
        <div className="relative h-[68%]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 10rem, 11rem"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
          )}
          <Overlay />

          <Actions id={id} title={title}>
            <button
              className="
                absolute top-1 right-1 rounded-md bg-black/30 p-1.5
                opacity-0 backdrop-blur-sm transition-opacity
                group-hover:opacity-100 focus:opacity-100
                outline-none
              "
              aria-label="Open actions"
            >
              <MoreHorizontal className="h-4 w-4 text-white" />
            </button>
          </Actions>
        </div>

        {/* Footer WITHOUT favorite */}
        <Footer timeAgo={timeAgo} title={title} authorLabel="You" />
      </div>
    </Link>
  );
};

NoteCard.Skeleton = function NoteCardSkeleton() {
  return (
    <div className="aspect-[3/4] w-40 sm:w-44 rounded-xl overflow-hidden">
      <Skeleton className="h-full w-full" />
    </div>
  );
};

export default NoteCard;
