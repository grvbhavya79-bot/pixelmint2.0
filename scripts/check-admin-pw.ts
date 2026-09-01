import { db } from "@/lib/db";
import { verifyPasswordHash, getAdminAccount } from "@/lib/server/admin-auth";
import { readFileSync } from "fs";

const envPassword = readFileSync("/home/z/my-project/.env", "utf8")
  .match(/^ADMIN_PASSWORD=(.+)$/m)?.[1]?.trim();

const account = await getAdminAccount();
console.log("account exists:", !!account);
console.log("passwordVersion:", account?.passwordVersion);
console.log("passwordChangedAt:", account?.passwordChangedAt?.toISOString());
console.log("lastLoginAt:", account?.lastLoginAt?.toISOString());
if (account && envPassword) {
  console.log("env password matches DB hash:", verifyPasswordHash(envPassword, account.passwordHash));
}
