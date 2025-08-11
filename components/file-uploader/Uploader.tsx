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

  const uploadFile = useCallback(async (file: File) => {
    setFileState((prev) => prev && { ...prev, uploading: true, progress: 0 });

    try {
      const presignedUrlResponse = await fetch("/api/s3/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          isImage: fileType === "image",
        }),
      });

      if (!presignedUrlResponse.ok) {
        toast.error("Failed to get presigned URL");
        setFileState(
          (prev) => prev && { ...prev, uploading: false, error: true }
        );
        return;
      }

      const { presignedUrl, uniqueKey } = await presignedUrlResponse.json();

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            setFileState(
              (prev) => prev && { ...prev, progress: Math.round(percent) }
            );
          }
        };
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            setFileState(
              (prev) =>
                prev && {
                  ...prev,
                  progress: 100,
                  uploading: false,
                  key: uniqueKey,
                }
            );
            onChange?.(uniqueKey);
            toast.success("File uploaded successfully");
            resolve(true);
          } else {
            reject(new Error("Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
    } catch (err) {
      toast.error("Failed to upload file");

      setFileState(
        (prev) => prev && { ...prev, uploading: false, error: true }
      );
    }
  }, []);

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
    maxSize: fileType === "video" ? 1024 * 1024 * 1024 : 5 * 1024 * 1024, // 5 MB for images, 1GB for videos
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(({ errors }) => {
        errors.forEach((e) => {
          if (e.code === "too-many-files") {
            toast.error("You can only upload one file at a time.");
          }
          if (e.code === "file-too-large") {
            toast.error("File size exceeds the 5 MB limit.");
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
        {fileState?.uploading ? (
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
