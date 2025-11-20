import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  eslint: {
    ignoreDuringBuilds: true, // matikan ESLint saat build di Vercel
  },
  typescript: {
    ignoreBuildErrors: true, // matikan TypeScript error saat build
  },
};

export default nextConfig;
