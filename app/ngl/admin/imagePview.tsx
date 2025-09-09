"use client";
import useConstructUrl from "@/hooks/use-construct-url";
import Image from "next/image";

const ImagePview = ({ fileKey }: { fileKey: string | null }) => {
  if (!fileKey) return null;
  const url = useConstructUrl(fileKey);
  return (
    <Image
      src={url}
      alt="Uploaded image"
      width={300}
      height={300}
      className="mt-2 rounded border"
    />
  );
};

export default ImagePview;
