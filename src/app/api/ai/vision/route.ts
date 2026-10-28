import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyzeImage } from '@/lib/ai'
import { findOwnedPet } from '@/lib/session'
import { aiErrorResponse, petContext } from '@/lib/ai-route'

const VALID_MODULES = ['VISION_SKIN', 'VISION_DENTAL', 'VISION_EYE', 'VISION_EAR', 'VISION_GENERAL'] as const
type VisionModule = (typeof VALID_MODULES)[number]

// POST /api/ai/vision  { petId, module, image (data URL) }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { petId, module, image } = body ?? {}
  if (typeof petId !== 'string' || typeof image !== 'string' || !module) {
    return NextResponse.json(
      { error: 'petId, module, and image required' },
      { status: 400 },
    )
  }
  if (!VALID_MODULES.includes(module)) {
    return NextResponse.json({ error: 'Invalid module' }, { status: 400 })
  }
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/.test(image)) {
    return NextResponse.json({ error: 'Image must be a PNG, JPEG, WebP or GIF data URL' }, { status: 400 })
  }

  // Limit image size to ~6MB to keep things sane.
  if (image.length > 6 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Image too large (max 6 MB)' },
      { status: 413 },
    )
  }

  const { pet, error } = await findOwnedPet(petId)
  if (error) return error

  let result
  try {
    result = await analyzeImage(image, module as VisionModule, petContext(pet))
  } catch (err) {
    return aiErrorResponse(err)
  }

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
