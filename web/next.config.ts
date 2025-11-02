/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // you already had this

  experimental: {
    // opt-out of static generation for community routes
    // (we'll use ISR instead)
  },

  // optional: suppress the multiple-lockfile warning
  turbopack: { root: __dirname },

  // Enable compression (gzip and brotli if available)
  compress: true,

  // Fix source maps - ensure they're generated properly in dev
  productionBrowserSourceMaps: false, // Disable in production for security/perf

  // Webpack config for when using --webpack flag (fallback)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack: (config: any, { dev, isServer }: any) => {
    if (dev && !isServer) {
      // Ensure source maps are generated properly with actual mappings
      // 'eval-source-map' provides inline source maps with full source content
      config.devtool = "eval-source-map";
    }

    return config;
  },

  // Headers including CSP
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
