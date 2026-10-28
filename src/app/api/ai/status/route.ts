import { NextResponse } from 'next/server'
import { aiProvider } from '@/lib/ai'

// GET /api/ai/status — lets the UI show whether live AI is available,
// without exposing which keys or endpoints are configured.
export async function GET() {
  return NextResponse.json({ configured: aiProvider() !== 'none' })
}
