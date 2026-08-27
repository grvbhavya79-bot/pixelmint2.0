import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  experimental: {
    // Gracefully recycle the Turbopack compiler instead of letting the
    // dev server grow unbounded when many routes compile in one session.
    // 1536 keeps total process RSS safely under the container's 4GB limit.
    turbopackMemoryLimit: 1536,
  },
  async redirects() {
    // Category-prefixed tool URL aliases (e.g. /pdf-tools/merge-pdf → /tools/merge-pdf)
    const categorySlugs = [
      "pdf-tools",
      "image-tools",
      "document-tools",
      "file-tools",
      "developer-tools",
      "generators-and-utilities",
      "calculators",
      "ai-tools",
    ];
    return categorySlugs.map((slug) => ({
      source: `/${slug}/:toolSlug`,
      destination: `/tools/:toolSlug`,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js requires inline bootstrap scripts; tesseract.js loads its
              // WASM core + language models from the jsdelivr CDN inside a worker
              "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' blob: data: https://cdn.jsdelivr.net https://api.frankfurter.dev https://open.er-api.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              // Google Maps embeds on the contact page
              "frame-src 'self' https://www.google.com https://maps.google.com",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/pdf.worker.min.mjs",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
