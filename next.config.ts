import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.app.github.dev",
        "localhost:3000",
        "127.0.0.1:3000",
        "hubya.tech",
        "www.hubya.tech",
      ],
    },
  },
};

export default nextConfig;
