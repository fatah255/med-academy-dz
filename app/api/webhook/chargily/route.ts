// import { NextRequest } from "next/server";
// import { verifySignature } from "@chargily/chargily-pay";
// import { prisma } from "@/lib/db";

// // Run on the Node.js runtime (not Edge) so we can use Buffers/crypto
// export const runtime = "nodejs";

// export async function POST(req: NextRequest) {
//   const signature = req.headers.get("signature") ?? "";
//   if (!signature) {
//     return new Response("Missing signature header", { status: 400 });
//   }

//   // Read raw body as text first (important for signature verification)
//   let raw: string;
//   try {
//     raw = await req.text();
//   } catch {
//     return new Response("Failed to read body", { status: 400 });
//   }

//   // Verify the signature against the raw body
//   try {
//     const ok = verifySignature(
//       Buffer.from(raw, "utf8"),
//       signature,
//       process.env.CHARGILY_SECRET_API_KEY || ""
//     );
//     if (!ok) return new Response("Invalid signature", { status: 403 });
//   } catch {
//     return new Response("Verification error", { status: 403 });
//   }

//   // Safe to parse after verification
//   let event: any;
//   try {
//     event = JSON.parse(raw);
//   } catch {
//     return new Response("Invalid JSON", { status: 400 });
//   }

//   // Implement your logic based on event.type, etc.
//   //if state 2 update to "paid" not "PAID"
//   console.log("Received event:", event);
//   if (event?.type === "checkout.paid" && event?.data?.status === "paid") {
//     console.log(event);
//     await prisma.enrollment.update({
//       where: {
//         transactionId: String(event?.data?.id),
//       },
//       data: {
//         status: "PAID",
//       },
//     });
//   }
//   return new Response("OK", { status: 200 });
// }
import { NextRequest } from "next/server";
import { verifySignature } from "@chargily/chargily-pay";
import { prisma } from "@/lib/db";

export const runtime = "nodejs"; // Node runtime for raw body

export async function POST(req: NextRequest) {
  const signature = req.headers.get("signature") ?? "";
  if (!signature) {
    return new Response("Missing signature header", { status: 400 });
  }

  // 1) Read the raw body (important for signature verification)
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return new Response("Failed to read body", { status: 400 });
  }

  // 2) Verify signature using your Chargily secret key
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

  // 3) Parse the verified payload
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Chargily v2 usually sends:
  //   type: "checkout.paid" | "checkout.failed" | "checkout.canceled" | ...
  //   data: { id, status, ... }
  const type = event?.type;
  const data = event?.data ?? {};
  const txId = String(data?.id ?? ""); // we store this as `transactionId`
  const status = String(data?.status ?? "").toLowerCase();

  if (!txId) {
    return new Response("Missing transaction id in payload", { status: 400 });
  }

  try {
    switch (type) {
      case "checkout.paid":
      case "payment.paid":
      case "charge.succeeded":
        // Mark ALL enrollments with this transaction as PAID
        //in 2nd case "paid"
        await prisma.enrollment.updateMany({
          where: { transactionId: txId, status: "PENDING" },
          data: { status: "PAID" },
        });
        break;

      default:
        // Ignore unknown or non-final events
        break;
    }
  } catch (e) {
    console.error("Webhook handler error:", e);
    // Return 200 so Chargily doesn't keep retrying due to app-side error
    return new Response("Handled with errors", { status: 200 });
  }

  return new Response("OK", { status: 200 });
}
