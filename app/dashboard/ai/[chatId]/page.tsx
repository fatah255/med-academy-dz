// import { requireUser } from "@/app/data/user/require-user";

import { requireUser } from "@/app/data/user/require-user";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import useConstructUrl from "@/hooks/use-construct-url";
import PdfRenderer from "@/components/PdfRenderer";
import RightPaneTabs from "@/components/RightPaneTabs";

interface PageProps {
  params: Promise<{ chatId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { chatId } = await params;
  const session = await requireUser();

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: session.user.id },
    select: { pdfFileKey: true, id: true },
  });

  if (!chat) notFound();
  const url = useConstructUrl(chat.pdfFileKey);

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] items-start">
        <section className="min-w-0">
          <PdfRenderer url={url} />
        </section>

        <aside className="min-w-0">
          <RightPaneTabs chatId={chat.id} />
        </aside>
      </div>
    </div>
  );
}
