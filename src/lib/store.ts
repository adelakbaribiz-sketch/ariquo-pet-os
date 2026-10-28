'use client'

import { create } from 'zustand'

// Single-page app navigation state for Ariquo.
// The / route hosts both the landing experience and the dashboard.

export type View = 'landing' | 'app'
export type AppSection =
  | 'dashboard'
  | 'pets'
  | 'pet-detail'
  | 'ai-triage'
  | 'ai-vision'
  | 'ai-nutrition'
  | 'ai-behavior'
  | 'marketplace'
  | 'preventive'
  | 'professional'
  | 'lost-pet'

interface AppState {
  view: View
  section: AppSection
  activePetId: string | null
  activeProviderFilter: string | null // provider type filter on marketplace
  aiModule: 'VISION_SKIN' | 'VISION_DENTAL' | 'VISION_EYE' | 'VISION_EAR' | 'VISION_GENERAL'

  enterApp: (section?: AppSection) => void
  exitToLanding: () => void
  setSection: (s: AppSection) => void
  openPet: (petId: string) => void
  setProviderFilter: (type: string | null) => void
  setAiModule: (m: AppState['aiModule']) => void
}

export const useApp = create<AppState>((set) => ({
  view: 'landing',
  section: 'dashboard',
  activePetId: null,
  activeProviderFilter: null,
  aiModule: 'VISION_SKIN',

  enterApp: (section) =>
    set({ view: 'app', section: section ?? 'dashboard' }),
  exitToLanding: () => set({ view: 'landing' }),
  setSection: (section) => set({ section }),
  openPet: (petId) => set({ section: 'pet-detail', activePetId: petId }),
  setProviderFilter: (type) => set({ activeProviderFilter: type }),
  setAiModule: (m) => set({ aiModule: m }),
}))

// Shared risk-level color & label helpers.

export const RISK_META: Record<
  string,
  { label: string; color: string; bg: string; ring: string }
> = {
  OBSERVATION: {
    label: 'Observation',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    ring: 'ring-sky-200 dark:ring-sky-900',
  },
  MONITOR: {
    label: 'Monitor at home',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    ring: 'ring-amber-200 dark:ring-amber-900',
  },
  VET_SOON: {
    label: 'See veterinarian soon',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    ring: 'ring-orange-200 dark:ring-orange-900',
  },
  EMERGENCY: {
    label: 'Emergency — immediate care',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/40',
    ring: 'ring-red-200 dark:ring-red-900',
  },
  UNKNOWN: {
    label: 'Unknown',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    ring: 'ring-border',
  },
}
