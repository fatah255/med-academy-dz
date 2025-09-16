"use client";
import { AnimatePresence } from "motion/react";

import BasicToast, { ToastType } from "@/components/smoothui/ui/BasicToast";
import { setSetup } from "./actions";

const LevelToast = ({
  isSetup,
  level,
  userId,
}: {
  isSetup: boolean;
  level: string;
  userId: string;
}) => {
  return (
    <AnimatePresence>
      {!isSetup && (
        <BasicToast
          message={`You are a ${level
            .split("_")
            .join(" ")
            .toLowerCase()} student you can change that in the settings`}
          type={"info"}
          duration={20000}
          onClose={async () => await setSetup(userId)}
        />
      )}
    </AnimatePresence>
  );
};

export default LevelToast;
