import { NextResponse } from 'next/server'
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
  if (!owner) throw new Error('No demo owner seeded. Run `bun run db:seed`.')
  return owner
}

/**
 * Resolve a pet that belongs to the current owner.
 * Returns either the pet or a ready-to-return 404 response, so routes never
 * read or mutate another owner's animals once real auth replaces the demo owner.
 */
export async function findOwnedPet(petId: string) {
  const owner = await requireOwner()
  const pet = await db.pet.findFirst({ where: { id: petId, ownerId: owner.id } })
  if (!pet) {
    return { pet: null, error: NextResponse.json({ error: 'Pet not found' }, { status: 404 }) } as const
  }
  return { pet, error: null } as const
}
