/**
 * Temporary seed for E2E verification of the admin dashboard rendering.
 * Inserts realistic ToolUsage / ContactMessage / ShortUrl rows via the
 * Prisma client, prints admin API responses, then (with --clean) wipes them.
 *
 * Usage:
 *   bun scripts/seed-admin-e2e.ts seed
 *   bun scripts/seed-admin-e2e.ts clean
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const DAY = 86_400_000;

const TOOLS = [
  "merge-pdf", "split-pdf", "compress-pdf", "pdf-to-images", "rotate-pdf",
  "image-compressor", "image-resizer", "image-converter", "background-remover",
  "word-counter", "case-converter", "qr-code-generator", "password-generator",
  "json-formatter", "minify-js", "markdown-to-html", "emi-calculator", "bmi-calculator",
];

async function seed() {
  const now = Date.now();
  // 40 usage events spread over the last 14 days (incl. 3 errors).
  const usages: { slug: string; status: string; createdAt: Date }[] = [];
  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.random() * 14;
    usages.push({
      slug: TOOLS[i % TOOLS.length],
      status: i % 13 === 0 ? "error" : "success",
      createdAt: new Date(now - daysAgo * DAY - Math.random() * DAY),
    });
  }
  await db.toolUsage.createMany({ data: usages });

  await db.contactMessage.createMany({
    data: [
      {
        name: "Riya Sharma",
        email: "riya.sharma@example.com",
        subject: "Love the PDF merge tool!",
        message: "Just wanted to say the merge tool is blazing fast. Any plans for PDF page reordering?",
        isRead: false,
        createdAt: new Date(now - 2 * 3600_000),
      },
      {
        name: "Dev Patel",
        email: "dev.patel@example.com",
        subject: "Feature request: WebP to PNG batch",
        message: "Would it be possible to add batch WebP conversion? Keep up the great work!",
        isRead: true,
        createdAt: new Date(now - 26 * 3600_000),
      },
    ],
  });

  const link = await db.shortUrl.create({
    data: { shortCode: "e2etest", destinationUrl: "https://example.com/launch", clickCount: 2 },
  });
  await db.shortUrlClick.createMany({
    data: [
      { shortUrlId: link.id, referrer: "https://t.co/x", createdAt: new Date(now - 45 * 60_000) },
      { shortUrlId: link.id, referrer: null, createdAt: new Date(now - 5 * 3600_000) },
    ],
  });

  console.log(`Seeded: ${usages.length} toolUsages, 2 messages, 1 shortUrl + 2 clicks`);
}

async function clean() {
  const r = await Promise.all([
    db.toolUsage.deleteMany(),
    db.contactMessage.deleteMany(),
    db.shortUrlClick.deleteMany(),
    db.shortUrl.deleteMany({ where: { shortCode: "e2etest" } }),
  ]);
  console.log("Cleaned:", r.map((x) => x.count).join(", "), "(toolUsage, messages, clicks, urls)");
}

const cmd = process.argv[2];
if (cmd === "seed") await seed();
else if (cmd === "clean") await clean();
else console.log("Usage: bun scripts/seed-admin-e2e.ts seed|clean");
await db.$disconnect();
