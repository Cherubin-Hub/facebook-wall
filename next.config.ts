import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ldesaldvwljykhutnxjo.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/profile-photos/**',
      },
      {
        protocol: 'https',
        hostname: 'ldesaldvwljykhutnxjo.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/wall-uploads/**',
      },
    ],
  },
};

export default nextConfig;
