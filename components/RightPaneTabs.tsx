// components/RightPaneTabs.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWrapper from "@/components/chat/ChatWrapper";
import QcmPanel from "@/components/qcm/QcmPanel";
import MindMapPanel from "@/components/mindmap/MindMapPanel";

export default function RightPaneTabs({ chatId }: { chatId: string }) {
  return (
    <Tabs defaultValue="chat" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="qcm">QCM</TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
      </TabsList>

      <div className="mt-3">
        <TabsContent value="qcm">
          <QcmPanel chatId={chatId} />
        </TabsContent>

        <TabsContent value="chat">
          <ChatWrapper isSubscribed fileId={chatId} />
        </TabsContent>

        <TabsContent value="mindmap">
          <MindMapPanel chatId={chatId} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
