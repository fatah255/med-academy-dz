// app/api/mux/uploads/[id]/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: { id: string } };

const id = process.env.MUX_TOKEN_ID;
const secret = process.env.MUX_TOKEN_SECRET;
const MUX_AUTH =
  "Basic " + Buffer.from(`${id ?? ""}:${secret ?? ""}`).toString("base64");

export async function GET(_req: Request, context: RouteCtx) {
  if (!id || !secret) {
    return NextResponse.json(
      { error: "Missing MUX_TOKEN_ID / MUX_TOKEN_SECRET" },
      { status: 500 }
    );
  }

  const uploadId = context.params.id;

  try {
    // 1) Upload status
    const up = await fetch(`https://api.mux.com/video/v1/uploads/${uploadId}`, {
      headers: { Authorization: MUX_AUTH, Accept: "application/json" },
    });
    const upCT = up.headers.get("content-type") || "";
    const upBody = upCT.includes("application/json")
      ? await up.json()
      : { error: await up.text() };
    if (!up.ok) return NextResponse.json(upBody, { status: up.status });

    const upload = upBody.data as {
      status: string;
      asset_id?: string | null;
    };

    if (!upload.asset_id) {
      return NextResponse.json({
        status: upload.status,
        ready: false,
        assetId: null,
        playbackId: null,
      });
    }

    // 2) Asset status
    const as = await fetch(
      `https://api.mux.com/video/v1/assets/${upload.asset_id}`,
      { headers: { Authorization: MUX_AUTH, Accept: "application/json" } }
    );
    const asCT = as.headers.get("content-type") || "";
    const asBody = asCT.includes("application/json")
      ? await as.json()
      : { error: await as.text() };
    if (!as.ok) return NextResponse.json(asBody, { status: as.status });

    const asset = asBody.data as {
      id: string;
      status: "preparing" | "ready" | "errored";
      playback_ids?: { id: string; policy: string }[];
    };

    const playbackId = asset.playback_ids?.[0]?.id || null;

    return NextResponse.json({
      status: asset.status,
      ready: asset.status === "ready" && !!playbackId,
      assetId: asset.id,
      playbackId,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Mux status failed" },
      { status: 500 }
    );
  }
}
