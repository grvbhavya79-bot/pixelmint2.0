import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Dev guard: `prisma db push` regenerates the client on disk, but the running
// dev server keeps serving its old instance from the global cache. If the
// cached client predates the current schema (detected via a model that only
// exists in newer schemas), drop it so a fresh client is constructed with
// the up-to-date model set.
function recycleStaleClient(): void {
  const cached = globalForPrisma.prisma as (PrismaClient & { adminAccount?: unknown }) | undefined
  if (cached && cached.adminAccount === undefined) {
    void cached.$disconnect().catch(() => undefined)
    globalForPrisma.prisma = undefined
  }
}

recycleStaleClient()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
