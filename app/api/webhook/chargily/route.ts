import { NextRequest } from "next/server";
import { verifySignature } from "@chargily/chargily-pay";
import { prisma } from "@/lib/db";

// Run on the Node.js runtime (not Edge) so we can use Buffers/crypto
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("signature") ?? "";
  if (!signature) {
    return new Response("Missing signature header", { status: 400 });
  }

  // Read raw body as text first (important for signature verification)
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return new Response("Failed to read body", { status: 400 });
  }

  // Verify the signature against the raw body
  try {
    const ok = verifySignature(
      Buffer.from(raw, "utf8"),
      signature,
      process.env.CHARGILY_SECRET_API_KEY || ""
    );
    if (!ok) return new Response("Invalid signature", { status: 403 });
  } catch {
    return new Response("Verification error", { status: 403 });
  }

  // Safe to parse after verification
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Implement your logic based on event.type, etc.
  //if state 2 update to "paid" not "PAID"
  console.log("Received event:", event);
  if (event?.type === "checkout.paid" && event?.data?.status === "paid") {
    console.log(event);
    await prisma.enrollment.update({
      where: {
        transactionId: String(event?.data?.id),
      },
      data: {
        status: "PAID",
      },
    });
  }
  return new Response("OK", { status: 200 });
}
