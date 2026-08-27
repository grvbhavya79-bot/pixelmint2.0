/**
 * Generate Pixelmint.fun brand assets with sharp:
 * - PWA icons: 192 / 512 / maskable-512 / apple-touch-icon (180)
 * - OG image: 1200x630
 * All from the 2x2 pixel-cluster brand mark + studio typography.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = "/home/z/my-project/public/icons";
mkdirSync(OUT, { recursive: true });

/** The brand mark: 2x2 mint/acid pixel cluster on a rounded dark tile. */
function markSvg(pad = 0, rounded = true): string {
  const size = 512 + pad * 2;
  const r = rounded ? 115 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0D1211"/>
  <rect x="${pad + 115}" y="${pad + 115}" width="128" height="128" fill="#67F5B4"/>
  <rect x="${pad + 269}" y="${pad + 115}" width="128" height="128" fill="#67F5B4" opacity="0.5"/>
  <rect x="${pad + 115}" y="${pad + 269}" width="128" height="128" fill="#67F5B4" opacity="0.5"/>
  <rect x="${pad + 269}" y="${pad + 269}" width="128" height="128" fill="#D6FF4B"/>
</svg>`;
}

async function main() {
  // PWA icons (mark on transparent-ish dark tile, purpose: any)
  await sharp(Buffer.from(markSvg())).resize(512, 512).png().toFile(`${OUT}/icon-512.png`);
  await sharp(Buffer.from(markSvg())).resize(192, 192).png().toFile(`${OUT}/icon-192.png`);
  // Maskable: extra safe-area padding, full-bleed background
  await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <rect width="512" height="512" fill="#0D1211"/>
        <rect x="156" y="156" width="88" height="88" fill="#67F5B4"/>
        <rect x="268" y="156" width="88" height="88" fill="#67F5B4" opacity="0.5"/>
        <rect x="156" y="268" width="88" height="88" fill="#67F5B4" opacity="0.5"/>
        <rect x="268" y="268" width="88" height="88" fill="#D6FF4B"/>
      </svg>`
    )
  )
    .resize(512, 512)
    .png()
    .toFile(`${OUT}/icon-maskable-512.png`);
  // Apple touch icon (180)
  await sharp(Buffer.from(markSvg())).resize(180, 180).png().toFile(`${OUT}/apple-touch-icon.png`);
  // Favicon 32
  await sharp(Buffer.from(markSvg())).resize(32, 32).png().toFile(`${OUT}/favicon-32.png`);

  // OG image — 1200x630, dark canvas, glow, brand mark, wordmark, tagline
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs>
      <radialGradient id="g1" cx="18%" cy="12%" r="60%">
        <stop offset="0%" stop-color="#67F5B4" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="#67F5B4" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="g2" cx="88%" cy="92%" r="55%">
        <stop offset="0%" stop-color="#D6FF4B" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="#D6FF4B" stop-opacity="0"/>
      </radialGradient>
      <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgb(255 255 255 / 0.05)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1200" height="630" fill="#080A0A"/>
    <rect width="1200" height="630" fill="url(#g1)"/>
    <rect width="1200" height="630" fill="url(#g2)"/>
    <rect width="1200" height="630" fill="url(#grid)"/>
    <rect x="96" y="120" width="52" height="52" fill="#67F5B4"/>
    <rect x="152" y="120" width="52" height="52" fill="#67F5B4" opacity="0.5"/>
    <rect x="96" y="176" width="52" height="52" fill="#67F5B4" opacity="0.5"/>
    <rect x="152" y="176" width="52" height="52" fill="#D6FF4B"/>
    <text x="240" y="188" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="58" fill="#EFF3EE">pixelmint<tspan fill="#67F5B4">.fun</tspan></text>
    <text x="96" y="360" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="118" fill="#EFF3EE">Mint ideas.</text>
    <text x="96" y="492" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="118" fill="#67F5B4">Ship pixels.</text>
    <text x="97" y="560" font-family="DejaVu Sans Mono, monospace" font-size="26" letter-spacing="6" fill="#A6B0A9">A CREATIVE DIGITAL STUDIO — EST. 2026</text>
    <rect x="1044" y="72" width="14" height="14" fill="#67F5B4"/>
    <rect x="1072" y="100" width="14" height="14" fill="#D6FF4B"/>
    <rect x="1100" y="72" width="14" height="14" fill="#67F5B4" opacity="0.5"/>
  </svg>`;
  await sharp(Buffer.from(og)).png().toFile(`${OUT}/og-image.png`);

  console.log("Pixelmint brand assets generated:");
  for (const f of ["icon-512.png", "icon-192.png", "icon-maskable-512.png", "apple-touch-icon.png", "favicon-32.png", "og-image.png"]) {
    const meta = await sharp(`${OUT}/${f}`).metadata();
    console.log(` - ${f}: ${meta.width}x${meta.height}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
