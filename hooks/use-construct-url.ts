import { env } from "@/lib/env";

export default function useConstructUrl(key: string | undefined | null) {
  return `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storageapi.dev/${key}`;
}
