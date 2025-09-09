// app/ngl/[code]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import SendForm from "./send-form";

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const link = await prisma.nglLink.findUnique({
    where: { code },
    select: { active: true, recipient: { select: { name: true } } },
  });
  if (!link || !link.active) return notFound();

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">
        Send {link.recipient.name ?? "this user"} an anonymous message
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your identity is not recorded. Be kind.
      </p>
      <div className="mt-6">
        <SendForm code={code} />
      </div>
    </div>
  );
}
