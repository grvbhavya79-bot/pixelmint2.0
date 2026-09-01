import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const r = await db.shortUrl.deleteMany({ where: { shortCode: "nextjs" } });
console.log("removed test link:", r.count);
await db.$disconnect();
