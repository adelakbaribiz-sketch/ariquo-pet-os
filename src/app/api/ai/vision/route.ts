import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyzeImage, PetContext } from '@/lib/ai'

function ageYears(birth?: Date | null): number | null {
  if (!birth) return null
  const diff = Date.now() - birth.getTime()
  return Math.max(0, Math.round((diff / (365.25 * 24 * 3600 * 1000)) * 10) / 10)
}

// POST /api/ai/vision  { petId, module, image (data URL) }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { petId, module, image } = body ?? {}
  if (!petId || !image || !module) {
    return NextResponse.json(
      { error: 'petId, module, and image required' },
      { status: 400 },
    )
  }
  const valid = ['VISION_SKIN', 'VISION_DENTAL', 'VISION_EYE', 'VISION_EAR', 'VISION_GENERAL']
  if (!valid.includes(module)) {
    return NextResponse.json({ error: 'Invalid module' }, { status: 400 })
  }

  // Limit image size to ~6MB to keep things sane.
  if (image.length > 6 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Image too large (max 6 MB)' },
      { status: 413 },
    )
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

  const result = await analyzeImage(
    image,
    module as Parameters<typeof analyzeImage>[1],
    ctx,
  )

  const assessment = await db.aIAssessment.create({
    data: {
      petId,
      module,
      inputImage: image.slice(0, 200), // small preview reference only
      observations: result.observations,
      riskLevel: result.riskLevel,
      confidence: result.confidence,
      recommendations: result.recommendations,
      escalation: result.escalation,
    },
  })

  return NextResponse.json({ result, assessment })
}
