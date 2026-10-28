import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOwner } from '@/lib/session'

// GET /api/pets — list current owner's pets
export async function GET() {
  const owner = await requireOwner()
  const pets = await db.pet.findMany({
    where: { ownerId: owner.id },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: {
        select: {
          events: true,
          vaccines: true,
          medications: true,
          reminders: true,
          assessments: true,
        },
      },
    },
  })
  return NextResponse.json({ pets })
}

// POST /api/pets — create a new pet for current owner
export async function POST(req: NextRequest) {
  const owner = await requireOwner()
  const body = await req.json()

  const {
    name,
    species,
    breed,
    sex,
    birthDate,
    weightKg,
    microchipId,
    color,
    neutered,
    allergies,
    notes,
    photoUrl,
  } = body ?? {}

  if (!name || !species) {
    return NextResponse.json(
      { error: 'name and species are required' },
      { status: 400 },
    )
  }
  if (!['DOG', 'CAT', 'BIRD', 'RABBIT', 'RODENT', 'REPTILE', 'FISH'].includes(species)) {
    return NextResponse.json(
      { error: 'species must be one of DOG | CAT | BIRD | RABBIT | RODENT | REPTILE | FISH' },
      { status: 400 },
    )
  }

  const pet = await db.pet.create({
    data: {
      ownerId: owner.id,
      name,
      species,
      breed: breed || null,
      sex: sex || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      weightKg: weightKg ? Number(weightKg) : null,
      microchipId: microchipId || null,
      color: color || null,
      neutered: !!neutered,
      allergies: allergies || null,
      notes: notes || null,
      photoUrl: photoUrl || null,
    },
  })

  if (pet.weightKg) {
    await db.weightLog.create({
      data: { petId: pet.id, weightKg: pet.weightKg },
    })
  }

  return NextResponse.json({ pet }, { status: 201 })
}
