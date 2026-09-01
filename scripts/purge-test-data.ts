import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const before = {
  toolUsage: await db.toolUsage.count(),
  shortUrls: await db.shortUrl.count(),
  clicks: await db.shortUrlClick.count(),
  messages: await db.contactMessage.count(),
};

// Purge test data created by automated verification runs (Aug 26–27).
// Everything in the DB predates real traffic, so wipe analytics wholesale.
await db.toolUsage.deleteMany({});

// Remove test short links (all created by E2E tests — example.com / test codes).
await db.shortUrl.deleteMany({});

// Remove test contact messages (Test User / Audit Bot / E2E / audit self-test).
await db.contactMessage.deleteMany({});

const after = {
  toolUsage: await db.toolUsage.count(),
  shortUrls: await db.shortUrl.count(),
  clicks: await db.shortUrlClick.count(),
  messages: await db.contactMessage.count(),
};

console.log("PURGED:", JSON.stringify({ before, after }, null, 2));
await db.$disconnect();
