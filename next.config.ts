import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vallaroo-storage.store',
      },
    ],
  },
};

export default nextConfig;
