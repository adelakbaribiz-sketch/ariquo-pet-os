/// <reference types="bun-types" />
import { describe, expect, test } from 'bun:test'
import { applyHash, stateToHash, useApp } from '../src/lib/store'

describe('hash routing', () => {
  test('landing has no hash', () => {
    expect(stateToHash({ view: 'landing', section: 'dashboard', activePetId: null })).toBe('')
  })

  test('app sections and pet profiles map to deep links', () => {
    expect(stateToHash({ view: 'app', section: 'marketplace', activePetId: null })).toBe('#/app/marketplace')
    expect(stateToHash({ view: 'app', section: 'pet-detail', activePetId: 'abc' })).toBe('#/app/pet/abc')
  })

  test('applyHash restores state and round-trips', () => {
    applyHash('#/app/pet/pet_123')
    let s = useApp.getState()
    expect(s.view).toBe('app')
    expect(s.section).toBe('pet-detail')
    expect(s.activePetId).toBe('pet_123')
    expect(stateToHash(s)).toBe('#/app/pet/pet_123')

    applyHash('#/app/professional')
    s = useApp.getState()
    expect(s.section).toBe('professional')
  })

  test('unknown sections fall back to dashboard; other hashes go to landing', () => {
    applyHash('#/app/does-not-exist')
    expect(useApp.getState().section).toBe('dashboard')
    applyHash('#pricing')
    expect(useApp.getState().view).toBe('landing')
  })
})
