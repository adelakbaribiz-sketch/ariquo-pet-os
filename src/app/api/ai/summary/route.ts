import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { summarizePetHistory } from '@/lib/ai'
import { findOwnedPet } from '@/lib/session'
import { aiErrorResponse, petContext } from '@/lib/ai-route'

// POST /api/ai/summary  { petId }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { petId } = body ?? {}
  if (typeof petId !== 'string') return NextResponse.json({ error: 'petId required' }, { status: 400 })

  const { pet, error } = await findOwnedPet(petId)
  if (error) return error

  const events = await db.medicalEvent.findMany({
    where: { petId },
    orderBy: { date: 'desc' },
    take: 25,
  })

  try {
    const summary = await summarizePetHistory(
      petContext(pet),
      events.map((e) => ({
        type: e.type,
        title: e.title,
        date: e.date.toISOString(),
        notes: e.notes,
      })),
    )
    return NextResponse.json({ summary })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
