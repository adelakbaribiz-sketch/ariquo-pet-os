// Shared helpers, types, and badge metadata for the Ariquo owner dashboard.
// Pure (non-React) utilities — safe to import from any client or server code.

import { format, differenceInCalendarDays } from 'date-fns'

// ─────────────────────────────────────────────
//  Types (mirror Prisma models; kept lightweight for client bundles)
// ─────────────────────────────────────────────

export interface PetCount {
  events: number
  vaccines: number
  medications: number
  reminders: number
  assessments: number
}

export interface Pet {
  id: string
  ownerId: string
  name: string
  species: string
  breed?: string | null
  sex?: string | null
  birthDate?: string | null
  weightKg?: number | null
  microchipId?: string | null
  photoUrl?: string | null
  color?: string | null
  neutered: boolean
  allergies?: string | null
  notes?: string | null
  status: string
  createdAt: string
  updatedAt: string
  _count?: PetCount
}

export interface MedicalEvent {
  id: string
  petId: string
  type: string
  title: string
  date: string
  notes?: string | null
  severity: string
  createdAt: string
}

export interface Vaccine {
  id: string
  petId: string
  name: string
  date: string
  nextDue?: string | null
  notes?: string | null
  createdAt: string
}

export interface Medication {
  id: string
  petId: string
  name: string
  dose?: string | null
  frequency?: string | null
  startDate: string
  endDate?: string | null
  active: boolean
  notes?: string | null
  createdAt: string
}

export interface AIAssessment {
  id: string
  petId: string
  module: string
  inputText?: string | null
  inputImage?: string | null
  observations?: string | null
  riskLevel: string
  confidence: number
  recommendations?: string | null
  escalation?: string | null
  createdAt: string
}

export interface WeightLog {
  id: string
  petId: string
  weightKg: number
  loggedAt: string
}

export interface Reminder {
  id: string
  petId: string
  title: string
  type: string
  dueAt: string
  done: boolean
  createdAt: string
}

export interface PetDocument {
  id: string
  petId: string
  name: string
  type: string
  fileUrl?: string | null
  notes?: string | null
  uploadedAt: string
}

export interface PetDetail extends Pet {
  events: MedicalEvent[]
  vaccines: Vaccine[]
  medications: Medication[]
  assessments: AIAssessment[]
  weightLogs: WeightLog[]
  reminders: Reminder[]
  documents: PetDocument[]
  bookings: unknown[]
}

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

export const AI_DISCLAIMER =
  'Ariquo AI provides observation and screening only — not a definitive veterinary diagnosis. When in doubt, contact your veterinarian.'

// Species supported by MVP. Others are shown disabled ("coming soon") in the UI.
export interface SpeciesOption {
  value: string
  label: string
  emoji: string
  soon?: boolean
}

export const SPECIES_OPTIONS: SpeciesOption[] = [
  { value: 'DOG', label: 'Dog', emoji: '🐕' },
  { value: 'CAT', label: 'Cat', emoji: '🐈' },
  { value: 'BIRD', label: 'Bird', emoji: '🐦', soon: true },
  { value: 'RABBIT', label: 'Rabbit', emoji: '🐇', soon: true },
  { value: 'RODENT', label: 'Rodent', emoji: '🐹', soon: true },
  { value: 'REPTILE', label: 'Reptile', emoji: '🦎', soon: true },
  { value: 'FISH', label: 'Fish', emoji: '🐠', soon: true },
]

// Selectable constants for forms
export const EVENT_TYPES = [
  'VACCINATION',
  'MEDICATION',
  'LAB',
  'IMAGING',
  'SURGERY',
  'VISIT',
  'SYMPTOM',
  'PROCEDURE',
  'NOTE',
] as const

export const SEVERITY_LEVELS = [
  'ROUTINE',
  'OBSERVATION',
  'WARNING',
  'EMERGENCY',
] as const

export const REMINDER_TYPES = [
  'VACCINE',
  'MEDICATION',
  'VET_APPOINTMENT',
  'GROOMING',
  'OTHER',
] as const

export const DOCUMENT_TYPES = [
  'LAB_REPORT',
  'XRAY',
  'PRESCRIPTION',
  'RECEIPT',
  'INSURANCE',
  'OTHER',
] as const

// ─────────────────────────────────────────────
//  Date helpers
// ─────────────────────────────────────────────

export function calcAge(birthDate?: string | null): string {
  if (!birthDate) return 'Unknown'
  const d = new Date(birthDate)
  if (isNaN(d.getTime())) return 'Unknown'
  const now = new Date()
  let years = now.getFullYear() - d.getFullYear()
  let months = now.getMonth() - d.getMonth()
  if (now.getDate() < d.getDate()) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }
  if (years < 0) return 'Unknown'
  if (years === 0 && months === 0) return 'Newborn'
  if (years === 0) return `${months} mo`
  if (months === 0) return `${years} yr`
  return `${years} yr ${months} mo`
}

export function formatDate(
  d?: string | null,
  fmt = 'MMM d, yyyy',
): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  try {
    return format(date, fmt)
  } catch {
    return '—'
  }
}

export function formatDateTime(d?: string | null): string {
  return formatDate(d, "MMM d, yyyy 'at' h:mm a")
}

export function dateInputValue(d?: string | null): string {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  try {
    return format(date, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

export function daysUntil(d?: string | null): number | null {
  if (!d) return null
  const target = new Date(d)
  if (isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const t = new Date(target)
  t.setHours(0, 0, 0, 0)
  return differenceInCalendarDays(t, today)
}

export function relativeDays(d?: string | null): string {
  const days = daysUntil(d)
  if (days === null) return '—'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days < 0) return `${Math.abs(days)} days ago`
  return `in ${days} days`
}

export function isWithinNextDays(d: string | null | undefined, days: number): boolean {
  const diff = daysUntil(d)
  if (diff === null) return false
  return diff >= 0 && diff <= days
}

export function isOverdue(d: string | null | undefined): boolean {
  const diff = daysUntil(d)
  return diff !== null && diff < 0
}

// ─────────────────────────────────────────────
//  Display label helpers
// ─────────────────────────────────────────────

export function speciesLabel(s?: string | null): string {
  if (!s) return 'Unknown'
  const found = SPECIES_OPTIONS.find((o) => o.value === s)
  return found ? found.label : s
}

export function speciesEmoji(s?: string | null): string {
  if (!s) return '🐾'
  const found = SPECIES_OPTIONS.find((o) => o.value === s)
  return found ? found.emoji : '🐾'
}

export function sexLabel(s?: string | null): string {
  if (s === 'MALE') return 'Male'
  if (s === 'FEMALE') return 'Female'
  return 'Unknown'
}

// ─────────────────────────────────────────────
//  Badge color metadata
//  Palette restricted to warm/emerald tones — no blue/indigo.
// ─────────────────────────────────────────────

export interface Meta {
  label: string
  className: string
  stripe?: string
  dot?: string
}

export function statusMeta(status?: string): Meta {
  switch (status) {
    case 'LOST':
      return {
        label: 'Lost',
        className:
          'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-900',
        dot: 'bg-red-500',
      }
    case 'DECEASED':
      return {
        label: 'In memoriam',
        className:
          'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ring-1 ring-zinc-300 dark:ring-zinc-700',
        dot: 'bg-zinc-500',
      }
    default:
      return {
        label: 'Active',
        className:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-900',
        dot: 'bg-emerald-500',
      }
  }
}

export function severityMeta(sev?: string): Meta {
  switch (sev) {
    case 'EMERGENCY':
      return {
        label: 'Emergency',
        className:
          'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
        stripe: 'bg-red-500',
      }
    case 'WARNING':
      return {
        label: 'Warning',
        className:
          'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
        stripe: 'bg-orange-500',
      }
    case 'OBSERVATION':
      return {
        label: 'Observation',
        className:
          'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
        stripe: 'bg-amber-400',
      }
    default:
      return {
        label: 'Routine',
        className: 'bg-muted text-muted-foreground',
        stripe: 'bg-primary/40',
      }
  }
}

export function eventTypeMeta(t?: string): Meta {
  switch (t) {
    case 'VACCINATION':
      return {
        label: 'Vaccination',
        className:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      }
    case 'MEDICATION':
      return {
        label: 'Medication',
        className:
          'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
      }
    case 'LAB':
      return {
        label: 'Lab',
        className:
          'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
      }
    case 'IMAGING':
      return {
        label: 'Imaging',
        className:
          'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
      }
    case 'SURGERY':
      return {
        label: 'Surgery',
        className:
          'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
      }
    case 'VISIT':
      return {
        label: 'Visit',
        className:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      }
    case 'SYMPTOM':
      return {
        label: 'Symptom',
        className:
          'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
      }
    case 'PROCEDURE':
      return {
        label: 'Procedure',
        className:
          'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
      }
    default:
      return {
        label: t ?? 'Note',
        className: 'bg-muted text-muted-foreground',
      }
  }
}

export function reminderTypeMeta(t?: string): Meta {
  switch (t) {
    case 'VACCINE':
      return {
        label: 'Vaccine',
        className:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      }
    case 'MEDICATION':
      return {
        label: 'Medication',
        className:
          'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
      }
    case 'VET_APPOINTMENT':
      return {
        label: 'Vet visit',
        className:
          'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
      }
    case 'GROOMING':
      return {
        label: 'Grooming',
        className:
          'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
      }
    default:
      return {
        label: 'Other',
        className: 'bg-muted text-muted-foreground',
      }
  }
}

export function moduleMeta(m?: string): Meta {
  switch (m) {
    case 'SYMPTOM':
      return {
        label: 'Symptom triage',
        className:
          'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
      }
    case 'VISION_SKIN':
      return {
        label: 'Vision · Skin',
        className:
          'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
      }
    case 'VISION_DENTAL':
      return {
        label: 'Vision · Dental',
        className:
          'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
      }
    case 'VISION_EYE':
      return {
        label: 'Vision · Eye',
        className:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      }
    case 'VISION_EAR':
      return {
        label: 'Vision · Ear',
        className:
          'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
      }
    case 'NUTRITION':
      return {
        label: 'Nutrition',
        className:
          'bg-lime-100 text-lime-700 dark:bg-lime-950/40 dark:text-lime-300',
      }
    case 'BEHAVIOR':
      return {
        label: 'Behavior',
        className:
          'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
      }
    case 'MOBILITY':
      return {
        label: 'Mobility',
        className:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      }
    case 'TRIAGE':
      return {
        label: 'Triage',
        className:
          'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
      }
    default:
      return {
        label: m ?? 'AI',
        className: 'bg-muted text-muted-foreground',
      }
  }
}

export function documentTypeMeta(t?: string): Meta {
  switch (t) {
    case 'LAB_REPORT':
      return {
        label: 'Lab report',
        className:
          'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
      }
    case 'XRAY':
      return {
        label: 'Imaging',
        className:
          'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
      }
    case 'PRESCRIPTION':
      return {
        label: 'Prescription',
        className:
          'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
      }
    case 'RECEIPT':
      return {
        label: 'Receipt',
        className: 'bg-muted text-muted-foreground',
      }
    case 'INSURANCE':
      return {
        label: 'Insurance',
        className:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      }
    default:
      return {
        label: t ?? 'Document',
        className: 'bg-muted text-muted-foreground',
      }
  }
}

// ─────────────────────────────────────────────
//  Misc
// ─────────────────────────────────────────────

export function initials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Confidence (0..1) → friendly label
export function confidenceLabel(c?: number): string {
  if (c == null || isNaN(c)) return 'n/a'
  const pct = Math.round(c * 100)
  if (pct >= 75) return `${pct}% (high)`
  if (pct >= 50) return `${pct}% (moderate)`
  if (pct > 0) return `${pct}% (low)`
  return 'n/a'
}

// Short, single-line preview of a longer text block
export function preview(text?: string | null, max = 120): string {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max).trimEnd() + '…'
}
