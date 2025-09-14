// components/qcm/QcmModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { QcmItem } from "./QcmPanel";
import QcmPlayer from "./QcmPlayer";

export default function QcmModal({
  open,
  onOpenChange,
  questions,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  questions: QcmItem[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          {/* Keep for accessibility; visually hidden so it won't clutter */}
          <DialogTitle className="sr-only">QCM Practice</DialogTitle>
        </DialogHeader>
        <QcmPlayer questions={questions} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
