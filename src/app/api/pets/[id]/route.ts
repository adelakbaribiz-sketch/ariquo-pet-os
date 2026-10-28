import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/pets/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const pet = await db.pet.findUnique({
    where: { id },
    include: {
      events: { orderBy: { date: 'desc' } },
      vaccines: { orderBy: { date: 'desc' } },
      medications: { orderBy: { startDate: 'desc' } },
      assessments: { orderBy: { createdAt: 'desc' }, take: 12 },
      weightLogs: { orderBy: { loggedAt: 'asc' } },
      reminders: { orderBy: { dueAt: 'asc' } },
      documents: { orderBy: { uploadedAt: 'desc' } },
      bookings: {
        orderBy: { scheduledAt: 'desc' },
        include: { provider: true, service: true },
      },
    },
  })
  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
  return NextResponse.json({ pet })
}

// PATCH /api/pets/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const existing = await db.pet.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

  const updated = await db.pet.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      breed: body.breed ?? existing.breed,
      sex: body.sex ?? existing.sex,
      birthDate: body.birthDate ? new Date(body.birthDate) : existing.birthDate,
      weightKg: body.weightKg != null ? Number(body.weightKg) : existing.weightKg,
      microchipId: body.microchipId ?? existing.microchipId,
      color: body.color ?? existing.color,
      neutered: body.neutered ?? existing.neutered,
      allergies: body.allergies ?? existing.allergies,
      notes: body.notes ?? existing.notes,
      photoUrl: body.photoUrl ?? existing.photoUrl,
      status: body.status ?? existing.status,
    },
  })

  if (body.weightKg != null && Number(body.weightKg) !== existing.weightKg) {
    await db.weightLog.create({
      data: { petId: id, weightKg: Number(body.weightKg) },
    })
  }

  return NextResponse.json({ pet: updated })
}

// DELETE /api/pets/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await db.pet.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
