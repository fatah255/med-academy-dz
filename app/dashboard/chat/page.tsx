// File: app/image-chat/page.tsx
import ImageChat from "@/components/chat/ImageChat";

export const metadata = {
  title: "Image Chat",
};

export default function Page() {
  return (
    <main className="container mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Image Chat</h1>
      <ImageChat />
    </main>
  );
}
