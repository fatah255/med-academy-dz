// "use client";

// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import {
//   DndContext,
//   rectIntersection,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DraggableSyntheticListeners,
// } from "@dnd-kit/core";
// import {
//   arrayMove,
//   SortableContext,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";
// import { useState } from "react";
// import { useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
// import { AdminSingleCourseType } from "@/app/data/admin/admin-get-course";
// import { cn } from "@/lib/utils";
// import {
//   Collapsible,
//   CollapsibleTrigger,
//   CollapsibleContent,
// } from "@/components/ui/collapsible";
// import {
//   ChevronDown,
//   ChevronRight,
//   DeleteIcon,
//   FileTextIcon,
//   GripVerticalIcon,
//   Trash2,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";

// interface CourseStructureProps {
//   course: AdminSingleCourseType;
// }

// interface SortableItemProps {
//   id: string;
//   children: (listeners: DraggableSyntheticListeners) => React.ReactNode;
//   className?: string;
//   data?: {
//     type: "chapter" | "lesson";
//     chapterId?: string;
//   };
// }

// const CourseStructure = ({ course }: CourseStructureProps) => {
//   function SortableItem({ id, children, className, data }: SortableItemProps) {
//     const {
//       attributes,
//       listeners,
//       setNodeRef,
//       transform,
//       transition,
//       isDragging,
//     } = useSortable({ id, data });

//     const style = {
//       transform: CSS.Transform.toString(transform),
//       transition,
//     };

//     return (
//       <div
//         ref={setNodeRef}
//         style={style}
//         {...attributes}
//         className={cn("touch-none ", className, isDragging && "z-10")}
//       >
//         {children(listeners)}
//       </div>
//     );
//   }

//   const initialItems =
//     course.chapter.map((chapter) => ({
//       id: chapter.id,
//       title: chapter.title,
//       order: chapter.position,
//       isOpen: true,
//       lessons: chapter.lesson.map((lesson) => ({
//         id: lesson.id,
//         title: lesson.title,
//         order: lesson.position,
//       })),
//     })) || [];

//   const [items, setItems] = useState(initialItems);
//   function handleDragEnd(event) {
//     const { active, over } = event;

//     if (active.id !== over?.id) {
//       setItems((items) => {
//         const oldIndex = items.indexOf(active.id);
//         const newIndex = items.indexOf(over?.id);

//         return arrayMove(items, oldIndex, newIndex);
//       });
//     }
//   }

//   const toggleChapter = (chapterId: string) => {
//     setItems((items) =>
//       items.map((item) =>
//         item.id === chapterId ? { ...item, isOpen: !item.isOpen } : item
//       )
//     );
//   };

//   const sensors = useSensors(
//     useSensor(PointerSensor),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates,
//     })
//   );

//   return (
//     <DndContext
//       sensors={sensors}
//       onDragEnd={handleDragEnd}
//       collisionDetection={rectIntersection}
//     >
//       <Card>
//         <CardHeader className="flex flex-row items-center justify-between border-b border-border">
//           Chapters
//         </CardHeader>
//         <CardContent>
//           <SortableContext items={items} strategy={verticalListSortingStrategy}>
//             {items.map((item) => (
//               <SortableItem
//                 key={item.id}
//                 data={{ type: "chapter" }}
//                 id={item.id}
//               >
//                 {(listeners) => (
//                   <Card>
//                     <Collapsible
//                       open={item.isOpen}
//                       onOpenChange={() => toggleChapter(item.id)}
//                       className="w-full"
//                     >
//                       <div className="flex items-center justify-between p-3 border-b border-border">
//                         <div className="flex items-center gap-2">
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             className="cursor-grab opacity-60 hover:opacity-100"
//                             {...listeners}
//                           >
//                             <GripVerticalIcon className="size-4" />
//                           </Button>
//                           <CollapsibleTrigger asChild>
//                             <Button
//                               size="icon"
//                               variant="ghost"
//                               className="flex items-center"
//                             >
//                               {item.isOpen ? (
//                                 <ChevronDown className="size-4" />
//                               ) : (
//                                 <ChevronRight className="size-4" />
//                               )}
//                             </Button>
//                           </CollapsibleTrigger>
//                           <p className="cursor-pointer hover:text-primary">
//                             {item.title}
//                           </p>
//                         </div>
//                         <Button size={"icon"} variant="outline">
//                           <Trash2 className="size-4" />
//                         </Button>
//                       </div>
//                       <CollapsibleContent>
//                         <div className="p-1">
//                           <SortableContext
//                             strategy={verticalListSortingStrategy}
//                             items={item.lessons.map((lesson) => lesson.id)}
//                           >
//                             {item.lessons.map((lesson) => (
//                               <SortableItem
//                                 key={lesson.id}
//                                 id={lesson.id}
//                                 data={{ type: "lesson", chapterId: item.id }}
//                               >
//                                 {(lessonListeners) => (
//                                   <div className="flex items-center justify-between p-2 hover:bg-accent rounded-sm">
//                                     <div className="flex items-center gap-2">
//                                       <Button
//                                         variant="ghost"
//                                         size="icon"
//                                         {...lessonListeners}
//                                       >
//                                         <GripVerticalIcon className="size-4" />
//                                       </Button>
//                                       <FileTextIcon className="size-4 text-muted-foreground" />
//                                       <Link
//                                         href={`/admin/courses/${course.id}/${item.id}/${lesson.id}`}
//                                       >
//                                         {lesson.title}
//                                       </Link>
//                                     </div>
//                                     <Button variant="outline" size="icon">
//                                       <Trash2 className="size-4" />
//                                     </Button>
//                                   </div>
//                                 )}
//                               </SortableItem>
//                             ))}
//                           </SortableContext>
//                           <div className="p-2">
//                             <Button className="w-full" variant="outline">
//                               Create new lesson
//                             </Button>
//                           </div>
//                         </div>
//                       </CollapsibleContent>
//                     </Collapsible>
//                   </Card>
//                 )}
//               </SortableItem>
//             ))}
//           </SortableContext>
//         </CardContent>
//       </Card>
//     </DndContext>
//   );
// };

// export default CourseStructure;

"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AdminSingleCourseType } from "@/app/data/admin/admin-get-course";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  FileTextIcon,
  GripVerticalIcon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CourseStructureProps {
  course: AdminSingleCourseType;
}

type ItemType = "chapter" | "lesson";

interface SortableItemProps {
  id: string;
  children: (listeners: DraggableSyntheticListeners) => React.ReactNode;
  className?: string;
  data?: {
    type: ItemType;
    chapterId?: string;
  };
}

type LessonItem = {
  id: string;
  title: string;
  order: number;
};

type ChapterItem = {
  id: string;
  title: string;
  order: number;
  isOpen: boolean;
  lessons: LessonItem[];
};

function SortableItem({ id, children, className, data }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn("touch-none ", className, isDragging && "z-10")}
    >
      {children(listeners)}
    </div>
  );
}

const CourseStructure = ({ course }: CourseStructureProps) => {
  const initialItems: ChapterItem[] =
    course.chapter?.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      order: chapter.position,
      isOpen: true,
      lessons:
        chapter.lesson?.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          order: lesson.position,
        })) ?? [],
    })) ?? [];

  const [items, setItems] = useState<ChapterItem[]>(initialItems);

  const toggleChapter = (chapterId: string) => {
    setItems((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, isOpen: !c.isOpen } : c))
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // helps avoid accidental drags
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    if (active.id === over.id) return;

    const activeType = active.data?.current?.type as ItemType | undefined;
    const overType = over.data?.current?.type as ItemType | undefined;

    // --- Reorder chapters ---
    if (activeType === "chapter" && overType === "chapter") {
      setItems((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === String(active.id));
        const newIndex = prev.findIndex((c) => c.id === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
      return;
    }

    // --- Reorder lessons (same chapter) or move across chapters ---
    if (activeType === "lesson" && overType === "lesson") {
      const fromChapterId = active.data?.current?.chapterId as
        | string
        | undefined;
      const toChapterId = over.data?.current?.chapterId as string | undefined;
      if (!fromChapterId || !toChapterId) return;

      setItems((prev) => {
        const fromChapterIndex = prev.findIndex((c) => c.id === fromChapterId);
        const toChapterIndex = prev.findIndex((c) => c.id === toChapterId);
        if (fromChapterIndex < 0 || toChapterIndex < 0) return prev;

        const fromChapter = prev[fromChapterIndex];
        const toChapter = prev[toChapterIndex];

        const fromIndex = fromChapter.lessons.findIndex(
          (l) => l.id === String(active.id)
        );
        const toIndex = toChapter.lessons.findIndex(
          (l) => l.id === String(over.id)
        );
        if (fromIndex < 0 || toIndex < 0) return prev;

        // Same chapter: reorder
        if (fromChapterId === toChapterId) {
          const newLessons = arrayMove(fromChapter.lessons, fromIndex, toIndex);
          return prev.map((c, i) =>
            i === fromChapterIndex ? { ...c, lessons: newLessons } : c
          );
        }

        // Cross-chapter: remove from one, insert into the other
        const moved = fromChapter.lessons[fromIndex];

        const newFromLessons = [
          ...fromChapter.lessons.slice(0, fromIndex),
          ...fromChapter.lessons.slice(fromIndex + 1),
        ];
        const newToLessons = [
          ...toChapter.lessons.slice(0, toIndex),
          moved,
          ...toChapter.lessons.slice(toIndex),
        ];

        return prev.map((c, i) => {
          if (i === fromChapterIndex) return { ...c, lessons: newFromLessons };
          if (i === toChapterIndex) return { ...c, lessons: newToLessons };
          return c;
        });
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      collisionDetection={rectIntersection}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          Chapters
        </CardHeader>
        <CardContent>
          {/* TOP-LEVEL: chapters must pass IDs, not objects */}
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <SortableItem
                key={item.id}
                data={{ type: "chapter" }}
                id={item.id}
              >
                {(listeners) => (
                  <Card>
                    <Collapsible
                      open={item.isOpen}
                      onOpenChange={() => toggleChapter(item.id)}
                      className="w-full"
                    >
                      <div className="flex items-center justify-between p-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="cursor-grab opacity-60 hover:opacity-100"
                            {...listeners}
                          >
                            <GripVerticalIcon className="size-4" />
                          </Button>
                          <CollapsibleTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="flex items-center"
                            >
                              {item.isOpen ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <p className="cursor-pointer hover:text-primary">
                            {item.title}
                          </p>
                        </div>
                        <Button size={"icon"} variant="outline">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <CollapsibleContent>
                        <div className="p-1">
                          {/* NESTED: lessons must pass IDs */}
                          <SortableContext
                            strategy={verticalListSortingStrategy}
                            items={item.lessons.map((lesson) => lesson.id)}
                          >
                            {item.lessons.map((lesson) => (
                              <SortableItem
                                key={lesson.id}
                                id={lesson.id}
                                data={{ type: "lesson", chapterId: item.id }}
                              >
                                {(lessonListeners) => (
                                  <div className="flex items-center justify-between p-2 hover:bg-accent rounded-sm">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        {...lessonListeners}
                                      >
                                        <GripVerticalIcon className="size-4" />
                                      </Button>
                                      <FileTextIcon className="size-4 text-muted-foreground" />
                                      <Link
                                        href={`/admin/courses/${course.id}/${item.id}/${lesson.id}`}
                                      >
                                        {lesson.title}
                                      </Link>
                                    </div>
                                    <Button variant="outline" size="icon">
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>
                                )}
                              </SortableItem>
                            ))}
                          </SortableContext>

                          <div className="p-2">
                            <Button className="w-full" variant="outline">
                              Create new lesson
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </CardContent>
      </Card>
    </DndContext>
  );
};

export default CourseStructure;
