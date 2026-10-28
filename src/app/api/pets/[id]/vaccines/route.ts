import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/pets/[id]/vaccines
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const vaccines = await db.vaccine.findMany({
    where: { petId: id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({ vaccines })
}

// POST /api/pets/[id]/vaccines
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const { name, date, nextDue, notes } = body ?? {}
  if (!name || !date) {
    return NextResponse.json({ error: 'name, date required' }, { status: 400 })
  }
  const vaccine = await db.vaccine.create({
    data: {
      petId: id,
      name,
      date: new Date(date),
      nextDue: nextDue ? new Date(nextDue) : null,
      notes: notes || null,
    },
  })
  return NextResponse.json({ vaccine }, { status: 201 })
}
