import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/pets/[id]/weight — append a weight log entry
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const { weightKg } = body ?? {}
  if (weightKg == null || isNaN(Number(weightKg))) {
    return NextResponse.json({ error: 'weightKg required' }, { status: 400 })
  }
  const log = await db.weightLog.create({
    data: { petId: id, weightKg: Number(weightKg) },
  })
  await db.pet.update({ where: { id }, data: { weightKg: Number(weightKg) } })
  return NextResponse.json({ weightLog: log }, { status: 201 })
}
