import SketchfabEmbed from "@/components/SketchfabEmbed";

const page = () => {
  return (
    <div className="c-viewer flex flex-col items-center justify-center w-2xl aspect-video">
      <iframe
        title="Crane à la Beauchène 3D model - Sketchfab"
        className="c-viewer__iframe w-full h-full"
        src="https://sketchfab.com/models/67985725f53543208f65457ebd284775/embed?autostart=1&amp;internal=1&amp;tracking=0&amp;ui_infos=0&amp;ui_snapshots=1&amp;ui_stop=0&amp;ui_watermark=0"
        id="api-frame"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        xr-spatial-tracking="true"
        execution-while-out-of-viewport="true"
        execution-while-not-rendered="true"
        web-share="true"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default page;
