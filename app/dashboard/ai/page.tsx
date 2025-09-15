// File: app/dashboard/ai/page.tsx
"use client";

import React from "react";
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

export default function AIPage() {
  return (
    <div className="mx-auto w-full max-w-4xl py-12 px-6 flex flex-col gap-8">
      <h1 className="text-3xl font-bold text-center mb-4">AI Assistant</h1>

      {/* PDF Chat Card */}
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

      {/* Normal Chat Card */}
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
        <CardContent className="flex justify-center">
          <Link href="/dashboard/chat">
            <Button size="lg">Start Chat</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
