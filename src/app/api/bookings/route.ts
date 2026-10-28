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

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

// POST /api/bookings  { providerId, serviceId, petId, scheduledAt, notes }
// Price is taken from the service on the server — never trusted from the client.
export async function POST(req: NextRequest) {
  const owner = await requireOwner()
  const body = await req.json().catch(() => null)
  const { providerId, serviceId, petId, scheduledAt, notes } = body ?? {}
  if (typeof providerId !== 'string' || !scheduledAt) {
    return NextResponse.json({ error: 'providerId and scheduledAt required' }, { status: 400 })
  }
  const when = new Date(scheduledAt)
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: 'scheduledAt is not a valid date' }, { status: 400 })
  }
  if (when.getTime() < Date.now() - 5 * 60_000) {
    return NextResponse.json({ error: 'Bookings must be scheduled in the future' }, { status: 400 })
  }

  const provider = await db.provider.findUnique({ where: { id: providerId } })
  if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 })

  let price: number | null = null
  if (serviceId) {
    const service = await db.service.findFirst({ where: { id: serviceId, providerId } })
    if (!service) return NextResponse.json({ error: 'Service not offered by this provider' }, { status: 400 })
    price = service.priceFrom
  }
  if (petId) {
    const pet = await db.pet.findFirst({ where: { id: petId, ownerId: owner.id } })
    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
  }

  const booking = await db.booking.create({
    data: {
      ownerId: owner.id,
      providerId,
      serviceId: serviceId || null,
      petId: petId || null,
      scheduledAt: when,
      notes: typeof notes === 'string' && notes.trim() ? notes.slice(0, 1000) : null,
      price,
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
  const owner = await requireOwner()
  const body = await req.json().catch(() => null)
  if (!BOOKING_STATUSES.includes(body?.status)) {
    return NextResponse.json(
      { error: `status must be one of ${BOOKING_STATUSES.join(' | ')}` },
      { status: 400 },
    )
  }
  const existing = await db.booking.findFirst({ where: { id, ownerId: owner.id } })
  if (!existing) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  const updated = await db.booking.update({
    where: { id },
    data: { status: body.status },
    include: { provider: true, service: true, pet: true },
  })
  return NextResponse.json({ booking: updated })
}
