import Link from "next/link";
import { FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import FileUpload from "@/components/FileUpload";
import ChatHistoryClient from "./_components/ChatHistoryClient";
import { listChats, createChat } from "./actions";

export default async function AIPage() {
  const chats = await listChats(); // server call
  // Ensure dates are serializable strings
  const initialChats = chats.map((c) => ({
    ...c,
    createdAt: (c.createdAt as Date).toISOString(),
  }));

  return (
    <div className="mx-auto w-full max-w-6xl py-6 px-4 md:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
        {/* Left: AI chat history (dashboard sidebar is inherited from /dashboard/layout.tsx) */}
        <ChatHistoryClient initialChats={initialChats} />

        {/* Right: your existing AI cards */}
        <div className="flex flex-col gap-8">
          <h1 className="text-3xl font-bold">AI Assistant</h1>

          {/* PDF Chat */}
          <Card className="w-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Chat with a PDF
              </CardTitle>
              <CardDescription>
                Upload a document and start asking questions about its content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload />
            </CardContent>
          </Card>

          {/* Normal Chat */}
          <Card className="w-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Normal Chat
              </CardTitle>
              <CardDescription>
                Chat with our AI assistant about any topic you want.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-3">
              <Link href="/dashboard/chat">
                <Button size="lg">Start Chat</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
