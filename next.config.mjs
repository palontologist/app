/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001', 
        'localhost:3002',
        'ideal-broccoli-jp9rgg7qvr7f5p5r-3000.app.github.dev',
        'ideal-broccoli-jp9rgg7qvr7f5p5r-3001.app.github.dev',
        'ideal-broccoli-jp9rgg7qvr7f5p5r-3002.app.github.dev',
        'ideal-broccoli-jp9rgg7qvr7f5p5r-3003.app.github.dev',
        'ideal-broccoli-jp9rgg7qvr7f5p5r-3004.app.github.dev',
        'ideal-broccoli-jp9rgg7qvr7f5p5r-3005.app.github.dev',
      ],
    },
  },
}

export default nextConfig