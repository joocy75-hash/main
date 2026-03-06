import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      { hostname: 'placehold.co' },
      { hostname: '*.rapidapi.com' },
      { hostname: '*.mbzp67c522.com' },
      { hostname: 'static-vue.baitaowang.com' },
      { hostname: 'static-mobile.mbzp67c522.com' },
      { hostname: 'i.pravatar.cc' },
    ],
  },
};

export default nextConfig;
