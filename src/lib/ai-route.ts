import 'server-only'
import { NextResponse } from 'next/server'
import type { Pet } from '@prisma/client'
import { AIUnavailableError, type PetContext } from '@/lib/ai'

// Shared helpers for the /api/ai/* route handlers.

function ageYears(birth?: Date | null): number | null {
  if (!birth) return null
  const diff = Date.now() - birth.getTime()
  return Math.max(0, Math.round((diff / (365.25 * 24 * 3600 * 1000)) * 10) / 10)
}

export function petContext(pet: Pet, recentHistory?: string): PetContext {
  return {
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    sex: pet.sex,
    ageYears: ageYears(pet.birthDate),
    weightKg: pet.weightKg,
    neutered: pet.neutered,
    allergies: pet.allergies,
    recentHistory,
  }
}

/** Map AI failures to an honest 503 instead of a fabricated answer. */
export function aiErrorResponse(err: unknown) {
  if (err instanceof AIUnavailableError) {
    return NextResponse.json({ error: err.message, code: 'AI_UNAVAILABLE' }, { status: 503 })
  }
  console.error('[api/ai]', err)
  return NextResponse.json({ error: 'Unexpected AI error.' }, { status: 500 })
}

export const MAX_TEXT = 2000
