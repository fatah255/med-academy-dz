// app/api/mux/uploads/[id]/route.ts
import { NextResponse } from "next/server";

const MUX_AUTH =
  "Basic " +
  Buffer.from(
    `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`
  ).toString("base64");

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const uploadId = params.id;

  // 1) Check upload
  const up = await fetch(`https://api.mux.com/video/v1/uploads/${uploadId}`, {
    headers: { Authorization: MUX_AUTH },
  });
  const upJson = await up.json();
  if (!up.ok) return NextResponse.json(upJson, { status: up.status });

  const upload = upJson.data as {
    id: string;
    status: string; // waiting, asset_created, cancelled, errored
    asset_id?: string | null;
  };

  // Not yet created an asset
  if (!upload.asset_id) {
    return NextResponse.json({
      status: upload.status,
      ready: false,
      assetId: null,
      playbackId: null,
    });
  }

  // 2) Check asset
  const assetRes = await fetch(
    `https://api.mux.com/video/v1/assets/${upload.asset_id}`,
    { headers: { Authorization: MUX_AUTH } }
  );
  const assetJson = await assetRes.json();
  if (!assetRes.ok)
    return NextResponse.json(assetJson, { status: assetRes.status });

  const asset = assetJson.data as {
    id: string;
    status: "preparing" | "ready" | "errored";
    playback_ids?: { id: string; policy: string }[];
  };

  const playbackId = asset.playback_ids?.[0]?.id || null;

  return NextResponse.json({
    status: asset.status, // 'preparing' | 'ready' | 'errored'
    ready: asset.status === "ready" && !!playbackId,
    assetId: asset.id,
    playbackId,
  });
}
