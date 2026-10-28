/// <reference types="bun-types" />
import { describe, expect, test } from 'bun:test'

// Read-only / validation checks against a running server. They never create
// or modify records, so they are safe to run against the demo database.
//   TEST_BASE_URL=http://localhost:3000 bun test tests
const BASE = process.env.TEST_BASE_URL
const run = BASE ? describe : describe.skip

async function post(path: string, body: unknown) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

run('API (live server)', () => {
  test('GET /api/pets lists the demo owner’s pets', async () => {
    const res = await fetch(`${BASE}/api/pets`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.pets)).toBe(true)
    expect(data.pets.length).toBeGreaterThan(0)
  })

  test('unknown pet returns 404', async () => {
    const res = await fetch(`${BASE}/api/pets/does-not-exist`)
    expect(res.status).toBe(404)
  })

  test('GET /api/providers returns the marketplace', async () => {
    const res = await fetch(`${BASE}/api/providers`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect((data.providers ?? []).length).toBeGreaterThan(0)
  })

  test('booking validation rejects bad input', async () => {
    expect((await post('/api/bookings', {})).status).toBe(400)
    expect((await post('/api/bookings', { providerId: 'x', scheduledAt: 'not-a-date' })).status).toBe(400)
    expect((await post('/api/bookings', { providerId: 'x', scheduledAt: '2000-01-01T10:00:00Z' })).status).toBe(400)
  })

  test('booking status PATCH validates status and ownership', async () => {
    const bad = await fetch(`${BASE}/api/bookings?id=nope`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'HACKED' }),
    })
    expect(bad.status).toBe(400)
    const missing = await fetch(`${BASE}/api/bookings?id=nope`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })
    expect(missing.status).toBe(404)
  })

  test('AI routes validate input and never fabricate results', async () => {
    expect((await post('/api/ai/symptom', {})).status).toBe(400)
    const status = await (await fetch(`${BASE}/api/ai/status`)).json()
    if (!status.configured) {
      const pets = (await (await fetch(`${BASE}/api/pets`)).json()).pets
      const res = await post('/api/ai/symptom', { petId: pets[0].id, text: 'Limping since this morning' })
      expect(res.status).toBe(503)
      const body = await res.json()
      expect(body.code).toBe('AI_UNAVAILABLE')
    }
  })
})
