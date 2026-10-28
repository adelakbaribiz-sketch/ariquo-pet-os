import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOwner } from '@/lib/session'

// GET /api/bookings
export async function GET() {
  const owner = await requireOwner()
  const bookings = await db.booking.findMany({
    where: { ownerId: owner.id },
    orderBy: { scheduledAt: 'desc' },
    include: { provider: true, service: true, pet: true },
  })
  return NextResponse.json({ bookings })
}

// POST /api/bookings  { providerId, serviceId, petId, scheduledAt, notes }
export async function POST(req: NextRequest) {
  const owner = await requireOwner()
  const body = await req.json()
  const { providerId, serviceId, petId, scheduledAt, notes, price } = body ?? {}
  if (!providerId || !scheduledAt) {
    return NextResponse.json({ error: 'providerId and scheduledAt required' }, { status: 400 })
  }
  const booking = await db.booking.create({
    data: {
      ownerId: owner.id,
      providerId,
      serviceId: serviceId || null,
      petId: petId || null,
      scheduledAt: new Date(scheduledAt),
      notes: notes || null,
      price: price != null ? Number(price) : null,
      status: 'PENDING',
    },
    include: { provider: true, service: true, pet: true },
  })
  return NextResponse.json({ booking }, { status: 201 })
}

// PATCH /api/bookings?id=...  { status }
export async function PATCH(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 })
  const body = await req.json()
  const updated = await db.booking.update({
    where: { id },
    data: { status: body.status },
    include: { provider: true, service: true, pet: true },
  })
  return NextResponse.json({ booking: updated })
}
