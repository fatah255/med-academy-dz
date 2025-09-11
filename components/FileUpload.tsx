"use client";

import React from "react";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Ask server for a presigned URL, then PUT the file to S3 */
async function uploadToS3(
  file: File
): Promise<{ file_key: string; file_name: string }> {
  const presignRes = await fetch("/api/s3/uploadPdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/pdf",
      size: file.size,
      isImage: false,
    }),
  });

  if (!presignRes.ok) {
    const txt = await presignRes.text();
    throw new Error(`Presign failed: ${presignRes.status} ${txt}`);
  }

  const { presignedUrl, uniqueKey } = (await presignRes.json()) as {
    presignedUrl: string;
    uniqueKey: string;
  };

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed: HTTP ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/pdf");
    xhr.send(file);
  });

  return { file_key: uniqueKey, file_name: file.name };
}

export default function FileUpload() {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: { file_key: string; file_name: string }) => {
      const res = await axios.post("/api/chat/create-chat", payload);
      return res.data as { chat_id: string };
    },
  });

  const { getRootProps, getInputProps, isDragActive, isFocused, isDragReject } =
    useDropzone({
      accept: { "application/pdf": [".pdf"] },
      maxFiles: 1,
      onDrop: async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
          toast.error("File too large (max 10 MB)");
          return;
        }

        try {
          setUploading(true);
          const data = await uploadToS3(file);
          mutate(data, {
            onSuccess: ({ chat_id }) => {
              toast.success("Chat created!");
              router.push(`/chat/${chat_id}`);
            },
            onError: (err) => {
              console.error(err);
              toast.error("Error creating chat");
            },
          });
        } catch (e: any) {
          console.error(e);
          toast.error(e?.message || "Upload failed");
        } finally {
          setUploading(false);
        }
      },
    });

  const busy = uploading || isPending;

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="p-0">
        <div
          // accessible & keyboard focus ring
          {...getRootProps()}
          aria-busy={busy}
          className={cn(
            "relative w-full h-52 md:h-56",
            "flex flex-col items-center justify-center text-center",
            "rounded-2xl border-2 border-dashed",
            "bg-muted/30 transition-colors",
            "outline-none ring-offset-background",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isDragActive
              ? "border-primary/60 bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary/40",
            isFocused && "ring-2 ring-ring ring-offset-2",
            isDragReject && "border-destructive/60"
          )}
          style={{ cursor: busy ? "not-allowed" : "pointer" }}
        >
          <input {...getInputProps()} disabled={busy} />

          {busy ? (
            <>
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading PDF…</p>
            </>
          ) : (
            <>
              <Inbox className="mb-2 h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                Drop PDF here or click to upload
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                .pdf • max 10&nbsp;MB
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
