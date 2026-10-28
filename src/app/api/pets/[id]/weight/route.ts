import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { findOwnedPet } from '@/lib/session'

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/pets/[id]/weight — append a weight log entry
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const owned = await findOwnedPet(id)
  if (owned.error) return owned.error
  const body = await req.json()
  const { weightKg } = body ?? {}
  const kg = Number(weightKg)
  if (weightKg == null || !Number.isFinite(kg) || kg <= 0 || kg > 150) {
    return NextResponse.json({ error: 'weightKg must be a number between 0 and 150' }, { status: 400 })
  }
  const log = await db.weightLog.create({
    data: { petId: id, weightKg: Number(weightKg) },
  })
  await db.pet.update({ where: { id }, data: { weightKg: Number(weightKg) } })
  return NextResponse.json({ weightLog: log }, { status: 201 })
}
