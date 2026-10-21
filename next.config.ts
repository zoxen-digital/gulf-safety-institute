import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const config: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["mongoose"],
  // PDF routes read the bundled brand PNGs from disk; ship them with the serverless functions.
  outputFileTracingIncludes: { "/api/**": ["./public/brand/**"] },
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  images: {
    localPatterns: [{ pathname: "/api/uploads/**" }, { pathname: "/brand/**" }, { pathname: "/images/**" }],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
      { source: "/verify/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default config;
