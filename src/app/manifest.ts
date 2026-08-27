import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pixelmint.fun — Every Tool. One Smart Place.",
    short_name: "Pixelmint",
    description:
      "100+ free online tools for PDFs, images, files, text, productivity, developers and more. Convert, edit, compress, create and organize — fast, private and easy.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7FAF8",
    theme_color: "#10B986",
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
