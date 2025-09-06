export default function SketchfabEmbed({ uid }: { uid: string }) {
  return (
    <iframe
      title="3D organ"
      width="100%"
      height="100%"
      allow="autoplay; fullscreen; xr-spatial-tracking"
      src={`https://sketchfab.com/models/${uid}/embed?autostart=1&ui_theme=dark`}
      style={{ border: 0 }}
    />
  );
}
