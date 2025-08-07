import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "med-academy-dz.t3.storageapi.dev",
        port: "",
      },
    ],
  },
};

export default nextConfig;
