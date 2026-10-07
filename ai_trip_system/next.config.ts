import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
  images: {
    remotePatterns: [
      //  DEV (local FastAPI)
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/api/v1/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/api/v1/**",
      },
      {
        protocol: "https",
        hostname: "aitripsystem-api.onrender.com",
        port: "",
        pathname: "/api/v1/**",
      },
      {
        protocol: "https",
        hostname: "ai-trip-api-40205731279.us-central1.run.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },

      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },

      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/**",
      },


      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: 'https',
        hostname: 'places.googleapis.com',
      },


      // 
    ],
  },
};

export default nextConfig;
