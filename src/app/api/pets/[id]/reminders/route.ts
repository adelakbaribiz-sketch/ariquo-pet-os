import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/pets/[id]/reminders
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const reminders = await db.reminder.findMany({
    where: { petId: id },
    orderBy: { dueAt: 'asc' },
  })
  return NextResponse.json({ reminders })
}

// POST /api/pets/[id]/reminders
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const { title, type, dueAt } = body ?? {}
  if (!title || !type || !dueAt) {
    return NextResponse.json({ error: 'title, type, dueAt required' }, { status: 400 })
  }
  const reminder = await db.reminder.create({
    data: { petId: id, title, type, dueAt: new Date(dueAt) },
  })
  return NextResponse.json({ reminder }, { status: 201 })
}

// PATCH /api/pets/[id]/reminders/[reminderId]  (handled via ?reminderId= query for simplicity)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const url = new URL(req.url)
  const reminderId = url.searchParams.get('reminderId')
  const body = await req.json()
  if (!reminderId) {
    return NextResponse.json({ error: 'reminderId query param required' }, { status: 400 })
  }
  const updated = await db.reminder.update({
    where: { id: reminderId, petId: id },
    data: {
      title: body.title,
      type: body.type,
      dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      done: body.done,
    },
  })
  return NextResponse.json({ reminder: updated })
}
