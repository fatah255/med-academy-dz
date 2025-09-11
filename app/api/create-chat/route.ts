import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
// import { loadS3IntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";

// /api/create-chat
export async function POST(req: Request, res: Response) {
  const session = await requireUser();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { file_key, file_name } = body;
    console.log(file_key, file_name);
    // await loadS3IntoPinecone(file_key);
    const chat = await prisma.chat.create({
      data: {
        userId: userId as string,
        pdfFileKey: file_key as string,
        pdfName: file_name as string,
        message: "",
      },
    });

    return NextResponse.json(
      {
        chat_id: chat.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}
