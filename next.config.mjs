import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  sw: "sw.js",
  scope: "/",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      }
    ]
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "react-hot-toast", "zustand"],
    // Faster client-side navigation
    optimisticClientCache: true,
  },
  
  // Keep compiled pages in memory longer (dev mode)
  onDemandEntries: {
    // Keep pages for 2 hours instead of 1 hour
    maxInactiveAge: 120 * 60 * 1000,
    // Increase buffer to reduce recompilation
    pagesBufferLength: 30,
  },
  
  // Webpack optimizations (simplified to avoid edge runtime issues)
  webpack: (config, { dev, isServer }) => {
    // Development optimizations
    if (dev && !isServer) {
      // Faster incremental rebuilds
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
    }
    
    return config;
  },
};

export default withPWA(nextConfig);
