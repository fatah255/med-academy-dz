import { IconMoodEmptyFilled } from "@tabler/icons-react";

const page = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <IconMoodEmptyFilled className="mb-4 h-12 w-12 text-primary" />

      <h1 className="font-bold text-pretty text-3xl">
        This course doesn't contain any lessons yet
      </h1>
    </div>
  );
};

export default page;
