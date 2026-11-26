import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output:
    process.platform === "win32" && !process.env.DOCKER_BUILD
      ? undefined
      : "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
