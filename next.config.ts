import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kzkekschzubgcbqwpfpz.supabase.co',
      },
    ],
  },
};

export default nextConfig;
