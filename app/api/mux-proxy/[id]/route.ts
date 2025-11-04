import { NextRequest, NextResponse } from "next/server";
//api/mux-proxy/[id]/route.ts
// Forward requests from your domain to Mux CDN

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Construct the Mux stream URL (HLS playlist)
  const muxUrl = `https://stream.mux.com/${id}.m3u8`;

  try {
    const muxResponse = await fetch(muxUrl, {
      headers: {
        // Pass original headers to mimic client
        "User-Agent": req.headers.get("user-agent") || "NextMuxProxy",
        Accept: "application/x-mpegURL, video/*;q=0.9,*/*;q=0.8",
      },
    });

    if (!muxResponse.ok) {
      return NextResponse.json(
        { error: `Mux returned ${muxResponse.status}` },
        { status: muxResponse.status }
      );
    }

    // Stream Mux response directly back to client
    const res = new NextResponse(muxResponse.body, {
      status: muxResponse.status,
      headers: {
        "Content-Type":
          muxResponse.headers.get("content-type") ||
          "application/vnd.apple.mpegurl",
        "Cache-Control": "public, max-age=60",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

    return res;
  } catch (err) {
    console.error("Mux proxy failed:", err);
    return NextResponse.json({ error: "Mux proxy failed" }, { status: 500 });
  }
}
