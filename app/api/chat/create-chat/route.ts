// import { requireUser } from "@/app/data/user/require-user";
// import { prisma } from "@/lib/db";
// import { loadS3IntoPinecone } from "@/lib/pinecone";
// import { NextResponse } from "next/server";

// // /api/create-chat
// export async function POST(req: Request, res: Response) {
//   const session = await requireUser();
//   const userId = session?.user?.id;
//   if (!userId) {
//     return NextResponse.json({ error: "unauthorized" }, { status: 401 });
//   }
//   try {
//     const body = await req.json();
//     const { file_key, file_name } = body;
//     console.log(file_key, file_name);
//     await loadS3IntoPinecone(file_key);
//     const chat = await prisma.chat.create({
//       data: {
//         userId: userId as string,
//         pdfFileKey: file_key as string,
//         pdfName: file_name as string,
//       },
//     });
//     return NextResponse.json(
//       {
//         chat_id: chat.id,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "internal server error" },
//       { status: 500 }
//     );
//   }
// }
// app/api/chat/create-chat/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { loadS3IntoPinecone } from "@/lib/pinecone";

export async function POST(req: Request) {
  const session = await requireUser();
  const userId = session?.user?.id;
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { file_key, file_name } = await req.json();

    // Ingest (sync version). If you prefer background, queue it and return early.
    await loadS3IntoPinecone(file_key);

    const chat = await prisma.chat.create({
      data: {
        userId,
        pdfFileKey: file_key,
        pdfName: file_name,
      },
    });

    return NextResponse.json({ chat_id: chat.id }, { status: 200 });
  } catch (err: any) {
    const msg = String(err?.message ?? err);

    if (msg.includes("EMBEDDINGS_QUOTA_EXCEEDED")) {
      return NextResponse.json(
        {
          error: "embeddings_quota",
          message:
            "Embeddings quota exhausted. Add billing or switch provider.",
        },
        { status: 429 }
      );
    }
    if (msg.includes("EMBEDDINGS_RATE_LIMIT")) {
      return NextResponse.json(
        {
          error: "embeddings_rate_limit",
          message: "Rate limited. Please retry shortly.",
        },
        { status: 429 }
      );
    }
    if (msg.includes("PINECONE_DIMENSION_MISMATCH")) {
      return NextResponse.json(
        { error: "pinecone_dimension", message: msg },
        { status: 400 }
      );
    }

    console.error("create-chat error:", err);
    return NextResponse.json(
      { error: "internal_server_error", message: msg },
      { status: 500 }
    );
  }
}
