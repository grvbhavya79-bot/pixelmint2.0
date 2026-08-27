/**
 * Generate Pixelmint.fun brand assets with sharp:
 * - PWA icons: 192 / 512 / maskable-512 / apple-touch-icon (180) / favicon-32
 * - OG image: 1200x630
 * Based on the pixel-P brand mark.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = "/home/z/my-project/public/icons";
mkdirSync(OUT, { recursive: true });

// Pixel grid cells that form the "P" (col,row) on a 5x5 grid
const P_CELLS: Array<[number, number]> = [
  [0, 0], [1, 0], [2, 0], [3, 0],
  [0, 1], [3, 1],
  [0, 2], [1, 2], [2, 2],
  [0, 3],
  [0, 4],
];

/** Build the pixel-P mark SVG at a given canvas size. */
function markSvg(size: number, bg: string, padding = 0): string {
  const cell = 6.8;
  const gap = 1.2;
  const origin = 4.2 + padding;
  const rects = P_CELLS.map(([c, r]) => {
    const isAccent = c === 3 && r === 1;
    const fill = isAccent ? "#40E6B1" : "#10B986";
    const opacity = isAccent ? ' opacity="0.85"' : "";
    return `<rect x="${origin + c * (cell + gap)}" y="${origin + r * (cell + gap)}" width="${cell}" height="${cell}" rx="1.6" fill="${fill}"${opacity}/>`;
  }).join("");
  const spark = `<rect x="${origin + 4 * (cell + gap) + 1.4 + padding}" y="${origin - 2.1 - padding}" width="5.4" height="5.4" rx="1.3" fill="#40E6B1"/>`;
  const s = size;
  const scale = s / 48;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" rx="${s * 0.21}" fill="${bg}"/>
    <g transform="scale(${scale})">${rects}${spark}</g>
  </svg>`;
}

async function main() {
  // Standard icons: light tile with mint P
  await sharp(Buffer.from(markSvg(512, "#F7FAF8"))).png().toFile(`${OUT}/icon-512.png`);
  await sharp(Buffer.from(markSvg(192, "#F7FAF8"))).png().toFile(`${OUT}/icon-192.png`);
  // Maskable: generous padding on mint background
  const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="512" height="512" fill="#10B986"/>
    <g transform="translate(96,96) scale(6.67)">
      ${P_CELLS.map(([c, r]) => `<rect x="${c * 8}" y="${r * 8}" width="6.8" height="6.8" rx="1.4" fill="#052B20"/>`).join("")}
    </g>
  </svg>`;
  await sharp(Buffer.from(maskable)).png().toFile(`${OUT}/icon-maskable-512.png`);
  await sharp(Buffer.from(markSvg(180, "#F7FAF8"))).png().toFile(`${OUT}/apple-touch-icon.png`);
  await sharp(Buffer.from(markSvg(32, "#F7FAF8"))).png().toFile(`${OUT}/favicon-32.png`);

  // OG image — 1200x630: light mint-tinted canvas, pixel grid, big wordmark + tagline
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs>
      <linearGradient id="mint-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#10B986"/>
        <stop offset="1" stop-color="#40E6B1"/>
      </linearGradient>
      <radialGradient id="glow1" cx="15%" cy="10%" r="55%">
        <stop offset="0%" stop-color="#40E6B1" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#40E6B1" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glow2" cx="90%" cy="95%" r="50%">
        <stop offset="0%" stop-color="#10B986" stop-opacity="0.14"/>
        <stop offset="100%" stop-color="#10B986" stop-opacity="0"/>
      </radialGradient>
      <pattern id="pixels" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="12" r="1.6" fill="#10B986" fill-opacity="0.12"/>
      </pattern>
    </defs>
    <rect width="1200" height="630" fill="#F7FAF8"/>
    <rect width="1200" height="630" fill="url(#glow1)"/>
    <rect width="1200" height="630" fill="url(#glow2)"/>
    <rect width="1200" height="630" fill="url(#pixels)"/>

    <!-- Pixel P mark -->
    <g transform="translate(96,108) scale(3.6)">
      ${P_CELLS.map(([c, r]) => `<rect x="${c * 8}" y="${r * 8}" width="6.8" height="6.8" rx="1.5" fill="url(#mint-grad)"/>`).join("")}
      <rect x="34.2" y="-2" width="5.2" height="5.2" rx="1.2" fill="#40E6B1"/>
    </g>

    <text x="290" y="196" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="62" fill="#15241D">Pixelmint<tspan fill="#10B986">.fun</tspan></text>

    <text x="96" y="356" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="92" fill="#15241D">Every tool.</text>
    <text x="96" y="466" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="92" fill="#10B986">One smart place.</text>
    <text x="97" y="540" font-family="DejaVu Sans, sans-serif" font-size="27" fill="#5C6B64">100+ free tools for PDFs, images, files, text, productivity, and more.</text>

    <!-- decorative pixels right side -->
    <rect x="1052" y="120" width="16" height="16" rx="3.5" fill="#10B986"/>
    <rect x="1092" y="168" width="12" height="12" rx="2.6" fill="#40E6B1"/>
    <rect x="1072" y="216" width="10" height="10" rx="2.2" fill="#10B986" opacity="0.5"/>
    <rect x="1024" y="480" width="14" height="14" rx="3" fill="#40E6B1" opacity="0.7"/>
    <rect x="1108" y="528" width="10" height="10" rx="2.2" fill="#10B986" opacity="0.6"/>
  </svg>`;
  await sharp(Buffer.from(og)).png().toFile(`${OUT}/og-image.png`);

  console.log("Pixelmint.fun brand assets generated:");
  for (const f of ["icon-512.png", "icon-192.png", "icon-maskable-512.png", "apple-touch-icon.png", "favicon-32.png", "og-image.png"]) {
    const meta = await sharp(`${OUT}/${f}`).metadata();
    console.log(` - ${f}: ${meta.width}x${meta.height}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
