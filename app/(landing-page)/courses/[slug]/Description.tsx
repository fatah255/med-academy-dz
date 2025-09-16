"use client";

import dynamic from "next/dynamic";

const RenderContent = dynamic(
  () => import("@/components/rich-text-editor/RenderContent"),
  {
    ssr: false,
  }
);

const Description = ({ description }: { description: string }) => {
  return <RenderContent content={description} />;
};

export default Description;
