"use client";
import dynamic from "next/dynamic";
import PomodoroClient from "./PomodoroClient";

const DynamicPomodoroClient = dynamic(() => Promise.resolve(PomodoroClient), {
  ssr: false,
});

const Pomodoro = () => {
  return <DynamicPomodoroClient />;
};

export default Pomodoro;
