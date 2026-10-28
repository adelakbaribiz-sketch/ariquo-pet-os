import { db } from '@/lib/db'

// In MVP demo we operate as a single seeded owner (Sara Ahmadi).
// Multi-owner / auth is intentionally out of scope per dossier §17.1 (TODO).
export async function getCurrentOwner() {
  const owner = await db.owner.findFirst({
    orderBy: { createdAt: 'asc' },
  })
  return owner
}

export async function requireOwner() {
  const owner = await getCurrentOwner()
  if (!owner) throw new Error('No demo owner seeded. Run `bun run src/lib/seed.ts`.')
  return owner
}
