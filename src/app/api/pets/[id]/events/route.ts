import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { findOwnedPet } from '@/lib/session'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/pets/[id]/events
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const owned = await findOwnedPet(id)
  if (owned.error) return owned.error
  const events = await db.medicalEvent.findMany({
    where: { petId: id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({ events })
}

// POST /api/pets/[id]/events
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const owned = await findOwnedPet(id)
  if (owned.error) return owned.error
  const body = await req.json()
  const { type, title, date, notes, severity } = body ?? {}
  if (!type || !title || !date) {
    return NextResponse.json({ error: 'type, title, date required' }, { status: 400 })
  }
  const event = await db.medicalEvent.create({
    data: {
      petId: id,
      type,
      title,
      date: new Date(date),
      notes: notes || null,
      severity: severity || 'ROUTINE',
    },
  })
  return NextResponse.json({ event }, { status: 201 })
}
