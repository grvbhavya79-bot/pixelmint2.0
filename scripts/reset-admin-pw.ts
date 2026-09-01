/**
 * Maintenance: reset the admin account password to the ADMIN_PASSWORD value
 * from .env (the password the owner already knows). Bumps passwordVersion so
 * every previously issued session is invalidated.
 */
import { db } from "@/lib/db";
import { hashPassword, verifyPasswordHash } from "@/lib/server/admin-auth";
import { readFileSync } from "fs";

const envPassword = readFileSync("/home/z/my-project/.env", "utf8")
  .match(/^ADMIN_PASSWORD=(.+)$/m)?.[1]?.trim();

if (!envPassword) {
  console.error("No ADMIN_PASSWORD in .env — nothing to reset to.");
  process.exit(1);
}

const before = await db.adminAccount.findUnique({ where: { id: "primary" } });
const updated = await db.adminAccount.update({
  where: { id: "primary" },
  data: {
    passwordHash: hashPassword(envPassword),
    passwordVersion: { increment: 1 },
    passwordChangedAt: new Date(),
  },
});

console.log("passwordVersion:", before?.passwordVersion, "->", updated.passwordVersion);
console.log("env password now verifies:", verifyPasswordHash(envPassword, updated.passwordHash));
