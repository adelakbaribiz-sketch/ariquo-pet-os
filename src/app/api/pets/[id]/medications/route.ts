import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { findOwnedPet } from '@/lib/session'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/pets/[id]/medications
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const owned = await findOwnedPet(id)
  if (owned.error) return owned.error
  const medications = await db.medication.findMany({
    where: { petId: id },
    orderBy: { startDate: 'desc' },
  })
  return NextResponse.json({ medications })
}

// POST /api/pets/[id]/medications
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const owned = await findOwnedPet(id)
  if (owned.error) return owned.error
  const body = await req.json()
  const { name, dose, frequency, startDate, endDate, notes, active } = body ?? {}
  if (!name) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }
  const med = await db.medication.create({
    data: {
      petId: id,
      name,
      dose: dose || null,
      frequency: frequency || null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      notes: notes || null,
      active: active !== false,
    },
  })
  return NextResponse.json({ medication: med }, { status: 201 })
}
