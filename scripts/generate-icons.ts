/**
 * Generates PWA icons from the brand SVG logo using sharp.
 * Run: bun scripts/generate-icons.ts
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <defs>
    <linearGradient id="bg" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3B82F6"/>
      <stop offset="0.55" stop-color="#2563EB"/>
      <stop offset="1" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="dot" x1="32" y1="32" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#67E8F9"/>
      <stop offset="1" stop-color="#2DD4BF"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#bg)"/>
  <rect x="12" y="12.5" width="24" height="5.5" rx="2.75" fill="#ffffff"/>
  <rect x="21.25" y="12.5" width="5.5" height="24" rx="2.75" fill="#ffffff"/>
  <circle cx="36.5" cy="36.5" r="4" fill="url(#dot)" stroke="#1E40AF" stroke-width="1.5"/>
</svg>`;

/** Maskable icon: artwork at 70% inside a solid brand-blue canvas. */
const MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <rect width="48" height="48" fill="#2563EB"/>
  <g transform="translate(7.2 7.2) scale(0.7)">
    <rect x="2" y="2" width="44" height="44" rx="12" fill="#1D4ED8"/>
    <rect x="12" y="12.5" width="24" height="5.5" rx="2.75" fill="#ffffff"/>
    <rect x="21.25" y="12.5" width="5.5" height="24" rx="2.75" fill="#ffffff"/>
    <circle cx="36.5" cy="36.5" r="4" fill="#67E8F9" stroke="#1E40AF" stroke-width="1.5"/>
  </g>
</svg>`;

async function main() {
  const outDir = resolve(import.meta.dir, "../public/icons");
  mkdirSync(outDir, { recursive: true });

  for (const size of [192, 512]) {
    await sharp(Buffer.from(SVG)).resize(size, size).png().toFile(resolve(outDir, `icon-${size}.png`));
  }
  // apple-touch-icon: 180px with slight padding handled by rx in SVG
  await sharp(Buffer.from(SVG)).resize(180, 180).png().toFile(resolve(outDir, "apple-touch-icon.png"));
  // maskable
  await sharp(Buffer.from(MASKABLE_SVG)).resize(512, 512).png().toFile(resolve(outDir, "icon-maskable-512.png"));
  // favicon PNG fallback
  await sharp(Buffer.from(SVG)).resize(32, 32).png().toFile(resolve(outDir, "favicon-32.png"));

  // og-image for social sharing (1200x630)
  const OG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" fill="none">
    <rect width="1200" height="630" fill="#F8FAFC"/>
    <rect width="1200" height="630" fill="url(#grid)" opacity="0.5"/>
    <defs>
      <linearGradient id="grid" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#2563EB" stop-opacity="0.06"/>
        <stop offset="1" stop-color="#2563EB" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <g transform="translate(80 90) scale(3.2)">
      <rect x="2" y="2" width="44" height="44" rx="12" fill="#2563EB"/>
      <rect x="12" y="12.5" width="24" height="5.5" rx="2.75" fill="#ffffff"/>
      <rect x="21.25" y="12.5" width="5.5" height="24" rx="2.75" fill="#ffffff"/>
      <circle cx="36.5" cy="36.5" r="4" fill="#67E8F9" stroke="#1E40AF" stroke-width="1.5"/>
    </g>
    <text x="80" y="390" font-family="system-ui, -apple-system, sans-serif" font-size="76" font-weight="800" fill="#0F172A">100 Powerful Tools.</text>
    <text x="80" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="76" font-weight="800" fill="#2563EB">One Simple Workspace.</text>
    <text x="80" y="560" font-family="system-ui, -apple-system, sans-serif" font-size="34" fill="#64748B">toolbox100 · PDF, image, document, developer &amp; calculator tools — free</text>
  </svg>`;
  await sharp(Buffer.from(OG)).png().toFile(resolve(outDir, "og-image.png"));

  writeFileSync(resolve(outDir, "logo.svg"), SVG);
  console.log("Icons generated in", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
