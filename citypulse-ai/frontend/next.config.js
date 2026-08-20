/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // localhost dev
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      // Production backend (Railway / any host)
      {
        protocol: "https",
        hostname: "**",
        pathname: "/uploads/**",
      },
    ],
  },

  async rewrites() {
    // In production the API URL is set via NEXT_PUBLIC_API_URL.
    // We only add the rewrite proxy for local dev where the env var
    // falls back to localhost:8000.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const isLocal = apiUrl.includes("localhost");
    if (!isLocal) return []; // On Vercel, frontend calls the backend directly
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },

  // Silence the eslint exhaustive-deps warnings during Vercel build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
