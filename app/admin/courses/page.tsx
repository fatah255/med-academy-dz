import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

const page = () => {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Courses</h1>
        <Link href="/admin/courses/create" className={buttonVariants()}>
          Create Course
        </Link>
      </div>
    </>
  );
};

export default page;
