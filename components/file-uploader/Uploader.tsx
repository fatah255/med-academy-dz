"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import {
  RenderEmptyState,
  RenderUploadedState,
  RenderUploadingState,
} from "./RenderState";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { set } from "zod";
import useConstructUrl from "@/hooks/use-construct-url";

interface FileState {
  id: string | null;
  file: File | null;
  uploading: boolean;
  key?: string;
  isDeleting: boolean;
  progress: number;
  error: boolean;
  objectUrl?: string;
  fileType: "image" | "video";
}

interface iAppProps {
  value?: string;
  onChange?: (value: string) => void;
  fileType: "image" | "video";
}

const Uploader = ({ value, onChange, fileType }: iAppProps) => {
  const fileUrl = useConstructUrl(value || "");
  const [fileState, setFileState] = useState<FileState>({
    id: null,
    file: null,
    uploading: false,
    isDeleting: false,
    progress: 0,
    error: false,
    fileType,
    objectUrl: value ? fileUrl : undefined,
  });

  const uploadFile = useCallback(
    async (file: File) => {
      setFileState(
        (p) => p && { ...p, uploading: true, progress: 0, error: false }
      );

      try {
        // 1) Ask server for a presigned URL
        const resp = await fetch("/api/s3/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type, // MUST match server's ContentType
            size: file.size,
            isImage: fileType === "image",
          }),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`Presign failed: ${resp.status} ${txt}`);
        }

        const { presignedUrl, uniqueKey } = await resp.json();

        // 2) PUT the file to S3/R2 using XHR to track progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setFileState((p) => p && { ...p, progress: pct });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setFileState(
                (p) =>
                  p && {
                    ...p,
                    progress: 100,
                    uploading: false,
                    key: uniqueKey,
                  }
              );
              onChange?.(uniqueKey);
              toast.success("File uploaded successfully");
              resolve();
            } else {
              // Show S3 error body if any (403 SignatureDoesNotMatch, etc.)
              const msg = xhr.responseText || `HTTP ${xhr.status}`;
              reject(new Error(`Upload failed: ${msg}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.open("PUT", presignedUrl);

          // Keep this header because your server signs with ContentType.
          // If you ever stop signing with ContentType, remove this line too.
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.send(file);
        });
      } catch (err: any) {
        console.error(err);
        toast.error(
          `Failed to upload file: ${err?.message ?? "Unknown error"}`
        );
        setFileState((p) => p && { ...p, uploading: false, error: true });
      }
    },
    [fileType, onChange]
  ); // ✅ add deps to avoid stale closures

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      if (fileState?.objectUrl && !fileState.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }

      const file = acceptedFiles[0];
      const objectUrl = URL.createObjectURL(file);

      const newFile: FileState = {
        id: uuid(),
        file,
        uploading: false,
        isDeleting: false,
        progress: 0,
        error: false,
        objectUrl,
        fileType,
      };

      setFileState(newFile);
      uploadFile(file);
    },
    [fileState?.objectUrl]
  );

  const handleRemoveFile = async () => {
    if (!fileState?.objectUrl || fileState.isDeleting) return;

    try {
      setFileState((prev) => prev && { ...prev, isDeleting: true });
      const response = await fetch("/api/s3/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: fileState.key }),
      });

      if (!response.ok) {
        toast.error("Failed to delete file");
        setFileState(
          (prev) => prev && { ...prev, isDeleting: true, error: true }
        );
        return;
      }
      onChange?.("");

      setFileState((prev) => ({
        id: null,
        file: null,
        uploading: false,
        isDeleting: false,
        progress: 0,
        error: false,
        objectUrl: undefined,
        fileType,
      }));
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error("Failed to remove file");
      setFileState(
        (prev) => prev && { ...prev, isDeleting: false, error: true }
      );
    }
  };

  useEffect(() => {
    return () => {
      if (fileState?.objectUrl && !fileState.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }
    };
  }, [fileState?.objectUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled:
      fileState?.uploading || fileState?.isDeleting || !!fileState?.objectUrl,
    accept: fileType === "video" ? { "video/*": [] } : { "image/*": [] },
    maxFiles: 1,
    multiple: false,
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB for images and videos
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(({ errors }) => {
        errors.forEach((e) => {
          console.log(e);
          if (e.code === "too-many-files") {
            toast.error("You can only upload one file at a time.");
          }
          if (e.code === "file-too-large") {
            toast.error("File size exceeds the 5 GB limit.");
          }
        });
      });
    },
  });

  return (
    <Card
      className={cn(
        "relative border-dashed border-2 border-gray-300 p-4 transition-colors duration-200 ease-in-out w-full h-64",
        isDragActive
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary"
      )}
      {...getRootProps()}
    >
      <CardContent className="flex items-center justify-center h-full">
        <input {...getInputProps()} />
        {fileState?.uploading && fileState.file ? (
          <RenderUploadingState
            file={fileState.file}
            progress={fileState.progress}
          />
        ) : fileState?.error ? (
          <p className="text-red-500">Error uploading file</p>
        ) : fileState?.objectUrl ? (
          <RenderUploadedState
            isDeleting={fileState.isDeleting}
            handleRemoveFile={handleRemoveFile}
            previewUrl={fileState.objectUrl}
            fileType={fileState.fileType}
          />
        ) : (
          <RenderEmptyState isDragActive={isDragActive} />
        )}
      </CardContent>
    </Card>
  );
};

export default Uploader;
