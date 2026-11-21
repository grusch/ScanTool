import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local production install builds into its own folder (.next-live), so dev server
  // and E2E builds (.next) never overwrite the running app – see scripts/live.mjs
  distDir: process.env.SCANTOOL_DIST_DIR || ".next",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          // No HSTS: the tool runs on http://127.0.0.1 only (PROJ-1)
        ],
      },
    ];
  },
};

export default nextConfig;
