import { requireUser } from "@/app/data/user/require-user";
// import ChatWrapper from "@/components/chat/ChatWrapper";
import { notFound, redirect } from "next/navigation";
import { ClientPdfRenderer } from "./_components/ClientPdfRenderer";

interface PageProps {
  params: Promise<{
    chatId: string;
  }>;
}
const url =
  "https://medacademydz.t3.storage.dev/0167baa8-6bcc-4921-b9be-a109a331bc30-02_-_series_numeriques_cours_complet-2.pdf";
const Page = async ({ params }: PageProps) => {
  const { chatId } = await params;

  const session = await requireUser();
  const user = session.user;

  // const file = await prisma.chat.findFirst({
  //   where: {
  //     id: chatId,
  //     userId: user.id,
  //   },
  // });

  // if (!file) notFound();

  return (
    <div className="flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2">
        {/* Left sidebar & main wrapper */}
        <div className="flex-1 xl:flex">
          <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
            {/* Main area */}
            <ClientPdfRenderer url={url} />
          </div>
        </div>

        <div className="shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0">
          {/* <ChatWrapper isSubscribed={plan.isSubscribed} fileId={file.id} /> */}
        </div>
      </div>
    </div>
  );
};

export default Page;
