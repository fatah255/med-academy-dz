"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import {
  RenderEmptyState,
  RenderUploadedState,
  RenderUploadingState,
} from "./RenderState";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import useConstructUrl from "@/hooks/use-construct-url";
import { deleteFileKey } from "@/app/admin/courses/[courseId]/edit/actions";

interface FileState {
  id: string | null;
  file: File | null;
  uploading: boolean;
  key?: string; // S3 object key
  isDeleting: boolean;
  progress: number;
  error: boolean;
  objectUrl?: string; // local preview OR remote URL (if value provided)
  fileType: "image" | "video";
}

interface UploaderProps {
  value?: string; // existing key from DB (optional)
  onChange?: (value: string) => void; // receives S3 key (or "" on delete)
  fileType: "image" | "video";
  courseId?: string; // used to clear DB key immediately after delete
}

const Uploader = ({ value, onChange, fileType, courseId }: UploaderProps) => {
  // SAFE: no cache-busting (useConstructUrl might already include a query)
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
    key: value || undefined,
  });

  // Keep preview URL & key in sync when `value` changes from outside
  useEffect(() => {
    setFileState((p) => {
      if (p?.objectUrl && p.objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(p.objectUrl);
      }
      return {
        id: p?.id ?? null,
        file: null,
        uploading: false,
        isDeleting: false,
        progress: 0,
        error: false,
        fileType,
        objectUrl: value ? fileUrl : undefined,
        key: value || undefined,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, fileUrl, fileType]);

  // Correctly-typed Accept map
  const accept = useMemo<Accept>(() => {
    return fileType === "video"
      ? ({ "video/*": [".mp4", ".mov", ".webm", ".mkv"] } as Accept)
      : ({ "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"] } as Accept);
  }, [fileType]);

  const uploadFile = useCallback(
    async (file: File) => {
      setFileState((p) => ({
        ...p,
        uploading: true,
        progress: 0,
        error: false,
      }));

      try {
        // 1) Get presigned URL
        const resp = await fetch("/api/s3/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            size: file.size,
            isImage: fileType === "image",
          }),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          if (resp.status === 401)
            throw new Error("Unauthorized (401). Are you admin?");
          if (resp.status === 429)
            throw new Error("Rate limited (429). Try again soon.");
          throw new Error(`Presign failed: ${resp.status} ${txt}`);
        }

        const { presignedUrl, uniqueKey } = await resp.json();

        // 2) Upload with progress via XHR
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setFileState((p) => ({ ...p, progress: pct }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setFileState((p) => ({
                ...p,
                progress: 100,
                uploading: false,
                key: uniqueKey,
              }));
              onChange?.(uniqueKey);
              toast.success("File uploaded successfully");
              resolve();
            } else {
              const msg = xhr.responseText || `HTTP ${xhr.status}`;
              reject(new Error(`Upload failed: ${msg}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });
      } catch (err: any) {
        console.error(err);
        toast.error(
          `Failed to upload file: ${err?.message ?? "Unknown error"}`
        );
        setFileState((p) => ({ ...p, uploading: false, error: true }));
      }
    },
    [fileType, onChange]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;

      // Cleanup previous blob preview
      setFileState((prev) => {
        if (prev?.objectUrl && prev.objectUrl.startsWith("blob:")) {
          URL.revokeObjectURL(prev.objectUrl);
        }
        return prev;
      });

      const file = acceptedFiles[0];
      const objectUrl = URL.createObjectURL(file);

      setFileState({
        id: uuid(),
        file,
        uploading: false,
        isDeleting: false,
        progress: 0,
        error: false,
        objectUrl,
        fileType,
        key: undefined, // set after upload
      });
      void uploadFile(file);
    },
    [fileType, uploadFile]
  );

  const handleRemoveFile = useCallback(async () => {
    if (fileState.isDeleting) return;

    // If there’s no uploaded key yet, just clear UI & parent
    if (!fileState.key) {
      setFileState((prev) => {
        if (prev?.objectUrl && prev.objectUrl.startsWith("blob:")) {
          URL.revokeObjectURL(prev.objectUrl);
        }
        return {
          id: null,
          file: null,
          uploading: false,
          isDeleting: false,
          progress: 0,
          error: false,
          objectUrl: undefined,
          fileType,
          key: undefined,
        };
      });
      onChange?.("");
      return;
    }

    try {
      setFileState((prev) => ({ ...prev, isDeleting: true }));

      // 1) delete from S3
      const response = await fetch("/api/s3/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: fileState.key }),
      });

      if (!response.ok) {
        const txt = await response.text();
        if (response.status === 401) {
          toast.error("Unauthorized (401). Are you logged in as admin?");
        } else if (response.status === 429) {
          toast.error("Rate limited (429). Please retry shortly.");
        } else {
          toast.error(`Failed to delete file: ${txt || response.status}`);
        }
        setFileState((prev) => ({ ...prev, isDeleting: false, error: true }));
        return;
      }

      // 2) clear key in DB immediately so refresh won’t resurrect it
      if (courseId) {
        try {
          await deleteFileKey(courseId);
        } catch (e: any) {
          console.error("deleteFileKey failed:", e);
          toast.error("Deleted from storage, but DB key wasn’t cleared.");
        }
      }

      // 3) update parent + local UI
      onChange?.("");
      setFileState((prev) => {
        if (prev?.objectUrl && prev.objectUrl.startsWith("blob:")) {
          URL.revokeObjectURL(prev.objectUrl);
        }
        return {
          id: null,
          file: null,
          uploading: false,
          isDeleting: false,
          progress: 0,
          error: false,
          objectUrl: undefined,
          fileType,
          key: undefined,
        };
      });
      toast.success("File deleted successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(
        `Failed to remove file: ${error?.message || "Unknown error"}`
      );
      setFileState((prev) => ({ ...prev, isDeleting: false, error: true }));
    }
  }, [courseId, fileState.isDeleting, fileState.key, fileType, onChange]);

  // Cleanup any blob URL on unmount
  useEffect(() => {
    return () => {
      if (fileState?.objectUrl && fileState.objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }
    };
  }, [fileState?.objectUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled:
      fileState.uploading || fileState.isDeleting || !!fileState.objectUrl,
    accept,
    maxFiles: 1,
    multiple: false,
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(({ errors }) => {
        errors.forEach((e) => {
          if (e.code === "too-many-files") {
            toast.error("You can only upload one file at a time.");
          } else if (e.code === "file-too-large") {
            toast.error("File size exceeds the 5 GB limit.");
          } else if (e.code === "file-invalid-type") {
            toast.error(
              fileType === "video"
                ? "Only video files are allowed."
                : "Only image files are allowed."
            );
          } else {
            toast.error(e.message || "File rejected.");
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
        {fileState.uploading && fileState.file ? (
          <RenderUploadingState
            file={fileState.file}
            progress={fileState.progress}
          />
        ) : fileState.error ? (
          <p className="text-red-500">Error uploading file</p>
        ) : fileState.objectUrl ? (
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
