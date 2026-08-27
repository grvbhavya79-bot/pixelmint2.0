import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pixelmint.fun — Mint ideas. Ship pixels.",
    short_name: "Pixelmint",
    description:
      "Pixelmint.fun is a creative digital studio for brands that refuse to blend in. Sharp identities, expressive websites, and digital experiences that people remember.",
    start_url: "/",
    display: "standalone",
    background_color: "#080A0A",
    theme_color: "#080A0A",
    orientation: "portrait-primary",
    categories: ["design", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
