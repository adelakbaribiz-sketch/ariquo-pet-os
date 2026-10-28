import { NextRequest, NextResponse } from 'next/server'
import { nutritionAdvice } from '@/lib/ai'
import { findOwnedPet } from '@/lib/session'
import { aiErrorResponse, MAX_TEXT, petContext } from '@/lib/ai-route'

// POST /api/ai/nutrition  { petId, question }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { petId, question } = body ?? {}
  if (typeof petId !== 'string' || typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'petId and question required' }, { status: 400 })
  }
  if (question.length > MAX_TEXT) {
    return NextResponse.json({ error: `Question too long (max ${MAX_TEXT} characters)` }, { status: 400 })
  }

  const { pet, error } = await findOwnedPet(petId)
  if (error) return error

  try {
    const answer = await nutritionAdvice(question, petContext(pet))
    return NextResponse.json({ answer })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
