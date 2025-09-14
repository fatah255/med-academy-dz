declare module "videojs-hls-quality-selector";
declare module "videojs-http-source-selector";

declare global {
  interface HTMLVideoElement {
    player?: any;
  }
  interface Window {
    videojs?: any;
  }
}
export {};
