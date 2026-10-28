import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyzeSymptom } from '@/lib/ai'
import { findOwnedPet } from '@/lib/session'
import { aiErrorResponse, MAX_TEXT, petContext } from '@/lib/ai-route'

// POST /api/ai/symptom  { petId, text }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { petId, text } = body ?? {}
  if (typeof petId !== 'string' || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'petId and text required' }, { status: 400 })
  }
  if (text.length > MAX_TEXT) {
    return NextResponse.json({ error: `Description too long (max ${MAX_TEXT} characters)` }, { status: 400 })
  }

  const { pet, error } = await findOwnedPet(petId)
  if (error) return error

  const recentEvents = await db.medicalEvent.findMany({
    where: { petId },
    orderBy: { date: 'desc' },
    take: 5,
  })
  const recentHistory = recentEvents
    .map((e) => `${new Date(e.date).toLocaleDateString()}: ${e.title}`)
    .join('; ')

  let result
  try {
    result = await analyzeSymptom(text, petContext(pet, recentHistory))
  } catch (err) {
    return aiErrorResponse(err)
  }

  // Persist only real AI output as a longitudinal, auditable record.
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
