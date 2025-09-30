// app/api/mux/direct-upload/route.ts
import { NextResponse } from "next/server";

const MUX_AUTH =
  "Basic " +
  Buffer.from(
    `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`
  ).toString("base64");

// (optionally) restrict uploads to your site only
const CORS_ORIGIN = process.env.MUX_CORS_ORIGIN || "*";

export async function POST() {
  const res = await fetch("https://api.mux.com/video/v1/uploads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: MUX_AUTH,
    },
    body: JSON.stringify({
      cors_origin: CORS_ORIGIN,
      new_asset_settings: {
        playback_policy: ["public"],
        mp4_support: "none",
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    return NextResponse.json(json, { status: res.status });
  }

  const { id, url } = json.data as { id: string; url: string };
  return NextResponse.json({ id, url });
}
