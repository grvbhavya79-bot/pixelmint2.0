import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ToolBox100 — 100 Powerful Tools. One Simple Workspace.",
    short_name: "ToolBox100",
    description:
      "Convert, compress, edit, generate, calculate and manage your files with 100 simple, free online tools.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#2563EB",
    orientation: "portrait-primary",
    categories: ["utilities", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "All Tools",
        url: "/tools",
      },
      {
        name: "Popular Tools",
        url: "/popular",
      },
      {
        name: "Favorites",
        url: "/favorites",
      },
    ],
  };
}
