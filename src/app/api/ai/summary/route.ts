import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { summarizePetHistory, PetContext } from '@/lib/ai'

function ageYears(birth?: Date | null): number | null {
  if (!birth) return null
  const diff = Date.now() - birth.getTime()
  return Math.max(0, Math.round((diff / (365.25 * 24 * 3600 * 1000)) * 10) / 10)
}

// POST /api/ai/summary  { petId }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { petId } = body ?? {}
  if (!petId) return NextResponse.json({ error: 'petId required' }, { status: 400 })

  const pet = await db.pet.findUnique({ where: { id: petId } })
  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

  const events = await db.medicalEvent.findMany({
    where: { petId },
    orderBy: { date: 'desc' },
    take: 25,
  })

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

  const summary = await summarizePetHistory(
    ctx,
    events.map((e) => ({
      type: e.type,
      title: e.title,
      date: e.date.toISOString(),
      notes: e.notes,
    })),
  )

  return NextResponse.json({ summary })
}
