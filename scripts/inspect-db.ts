import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const toolUsage = await db.toolUsage.groupBy({
  by: ["slug", "status"],
  _count: true,
  orderBy: { _count: { slug: "desc" } },
  take: 20,
});
const totalUses = await db.toolUsage.count();
const oldest = await db.toolUsage.findFirst({ orderBy: { createdAt: "asc" } });
const newest = await db.toolUsage.findFirst({ orderBy: { createdAt: "desc" } });

const urls = await db.shortUrl.findMany({
  select: { shortCode: true, destinationUrl: true, clickCount: true, isActive: true, createdAt: true },
  take: 30,
});

const messages = await db.contactMessage.findMany({
  select: { name: true, email: true, subject: true, isRead: true, createdAt: true },
  take: 30,
});

console.log("=== TOOL USAGE ===", JSON.stringify({ total: totalUses, oldest: oldest?.createdAt, newest: newest?.createdAt }, null, 2));
console.log(JSON.stringify(toolUsage, null, 1));
console.log("=== SHORT URLS ===");
console.log(JSON.stringify(urls, null, 1));
console.log("=== MESSAGES ===");
console.log(JSON.stringify(messages, null, 1));
await db.$disconnect();
