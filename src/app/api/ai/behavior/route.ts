import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { behaviorAdvice, PetContext } from '@/lib/ai'

function ageYears(birth?: Date | null): number | null {
  if (!birth) return null
  const diff = Date.now() - birth.getTime()
  return Math.max(0, Math.round((diff / (365.25 * 24 * 3600 * 1000)) * 10) / 10)
}

// POST /api/ai/behavior  { petId, question }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { petId, question } = body ?? {}
  if (!petId || !question) {
    return NextResponse.json({ error: 'petId and question required' }, { status: 400 })
  }
  const pet = await db.pet.findUnique({ where: { id: petId } })
  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

  const ctx: PetContext = {
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    sex: pet.sex,
    ageYears: ageYears(pet.birthDate),
    weightKg: pet.weightKg,
    neutered: pet.neutered,
    allergies: pet.allergies,
  }

  const answer = await behaviorAdvice(question, ctx)
  return NextResponse.json({ answer })
}
