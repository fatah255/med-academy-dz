"use client";

import { UIGame } from "@/app/quizzes/_components/QCM";
import dynamic from "next/dynamic";
const MCQ = dynamic(() => import("@/app/quizzes/_components/QCM"), {
  ssr: false,
});

type Props = { game: UIGame };
const ClientQCM = ({ game }: Props) => {
  return <MCQ game={game} />;
};

export default ClientQCM;
