import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import NewNoteCard from "./_components/NewNoteCard";
import NoteCard from "./_components/NoteCard";

const page = async () => {
  const session = await requireUser();
  const notes = await prisma.notes.findMany({
    where: { userId: session.user.id },
    select: { id: true, title: true, createdAt: true, imageNumber: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ml-1">
      <NewNoteCard />
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          id={note.id}
          title={note.title}
          createdAt={note.createdAt}
          imageUrl={`/placeholders/${note.imageNumber}.svg`}
        />
      ))}
    </div>
  );
};

export default page;
