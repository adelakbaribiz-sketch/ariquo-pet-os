import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyzeSymptom, PetContext } from '@/lib/ai'

function ageYears(birth?: Date | null): number | null {
  if (!birth) return null
  const diff = Date.now() - birth.getTime()
  return Math.max(0, Math.round((diff / (365.25 * 24 * 3600 * 1000)) * 10) / 10)
}

// POST /api/ai/symptom  { petId, text }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { petId, text } = body ?? {}
  if (!petId || !text) {
    return NextResponse.json({ error: 'petId and text required' }, { status: 400 })
  }

  const pet = await db.pet.findUnique({ where: { id: petId } })
  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

  const recentEvents = await db.medicalEvent.findMany({
    where: { petId },
    orderBy: { date: 'desc' },
    take: 5,
  })
  const recentHistory = recentEvents
    .map((e) => `${new Date(e.date).toLocaleDateString()}: ${e.title}`)
    .join('; ')

  const ctx: PetContext = {
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

  const result = await analyzeSymptom(text, ctx)

  // Persist assessment as longitudinal record (auditable).
  const assessment = await db.aIAssessment.create({
    data: {
      petId,
      module: 'SYMPTOM',
      inputText: text,
      observations: result.observations,
      riskLevel: result.riskLevel,
      confidence: result.confidence,
      recommendations: result.recommendations,
      escalation: result.escalation,
    },
  })

  return NextResponse.json({ result, assessment })
}
