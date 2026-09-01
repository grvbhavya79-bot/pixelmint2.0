import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
// Remove records created during this verification session only.
const r1 = await db.toolUsage.deleteMany({ where: { createdAt: { gte: new Date("2026-09-01T00:00:00Z") } } });
const r2 = await db.shortUrl.deleteMany({ where: { shortCode: "launch25" } });
console.log("cleaned:", { toolUsage: r1.count, shortUrls: r2.count });
await db.$disconnect();
