import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/providers?type=VETERINARIAN
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const q = url.searchParams.get('q')

  const providers = await db.provider.findMany({
    where: {
      AND: [
        type ? { type } : {},
        q ? { name: { contains: q } } : {},
      ],
    },
    orderBy: { rating: 'desc' },
    include: {
      services: true,
      _count: { select: { bookings: true } },
    },
  })
  return NextResponse.json({ providers })
}
