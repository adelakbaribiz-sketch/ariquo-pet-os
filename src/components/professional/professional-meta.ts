/**
 * Professional (veterinarian) dashboard — shared helpers, types & visual metadata.
 *
 * IMPORTANT (dossier §21): AI outputs in Ariquo are observation / screening /
 * risk-assessment / triage only — NEVER a definitive veterinary diagnosis.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types — mirror the Prisma models we get from the API.
// We keep these as interfaces (not Prisma-generated) so the client bundle stays
// light and resilient to schema additions.
// ─────────────────────────────────────────────────────────────────────────────

export interface PetListItem {
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
  _count: {
    events: number
    vaccines: number
    medications: number
    reminders: number
    assessments: number
  }
}

export interface MedicalEvent {
  id: string
  petId: string
  type: string
  title: string
  date: string
  notes?: string | null
  severity: string
}

export interface Vaccine {
  id: string
  petId: string
  name: string
  date: string
  nextDue?: string | null
  notes?: string | null
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

export interface DocumentRow {
  id: string
  petId: string
  name: string
  type: string
  fileUrl?: string | null
  notes?: string | null
  uploadedAt: string
}

export interface Reminder {
  id: string
  petId: string
  title: string
  type: string
  dueAt: string
  done: boolean
}

export interface Provider {
  id: string
  name: string
  type: string
  specialty?: string | null
  clinic?: string | null
  city: string
  country: string
  address?: string | null
  phone?: string | null
  email?: string | null
  avatarUrl?: string | null
  rating: number
  reviewCount: number
  verified: boolean
  bio?: string | null
}

export interface Service {
  id: string
  providerId: string
  name: string
  description?: string | null
  durationMins?: number | null
  priceFrom?: number | null
  category: string
}

export interface Booking {
  id: string
  ownerId: string
  providerId: string
  petId?: string | null
  serviceId?: string | null
  scheduledAt: string
  status: string
  notes?: string | null
  price?: number | null
  provider: Provider
  service?: Service | null
  pet?: {
    id: string
    name: string
    species: string
    breed?: string | null
    photoUrl?: string | null
  } | null
}

export interface PetDetail extends Omit<PetListItem, '_count'> {
  events: MedicalEvent[]
  vaccines: Vaccine[]
  medications: Medication[]
  assessments: AIAssessment[]
  weightLogs: WeightLog[]
  reminders: Reminder[]
  documents: DocumentRow[]
  bookings: Booking[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual metadata
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Module badge visual metadata.
 * Palette is warm / green / coral only — NO blue or indigo per project rules.
 * Each entry provides a small pill-style color scheme + a solid dot for legend use.
 */
export const MODULE_META: Record<
  string,
  { label: string; color: string; bg: string; ring: string; dot: string }
> = {
  SYMPTOM: {
    label: 'Symptom triage',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    ring: 'ring-orange-200 dark:ring-orange-900',
    dot: 'bg-orange-500',
  },
  VISION_SKIN: {
    label: 'Vision · Skin',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    ring: 'ring-rose-200 dark:ring-rose-900',
    dot: 'bg-rose-500',
  },
  VISION_DENTAL: {
    label: 'Vision · Dental',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    ring: 'ring-emerald-200 dark:ring-emerald-900',
    dot: 'bg-emerald-500',
  },
  VISION_EYE: {
    label: 'Vision · Eye',
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    ring: 'ring-teal-200 dark:ring-teal-900',
    dot: 'bg-teal-500',
  },
  VISION_EAR: {
    label: 'Vision · Ear',
    color: 'text-pink-700 dark:text-pink-300',
    bg: 'bg-pink-50 dark:bg-pink-950/40',
    ring: 'ring-pink-200 dark:ring-pink-900',
    dot: 'bg-pink-500',
  },
  VISION_GENERAL: {
    label: 'Vision · General',
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-900/40',
    ring: 'ring-slate-200 dark:ring-slate-700',
    dot: 'bg-slate-500',
  },
  NUTRITION: {
    label: 'Nutrition',
    color: 'text-lime-700 dark:text-lime-300',
    bg: 'bg-lime-50 dark:bg-lime-950/40',
    ring: 'ring-lime-200 dark:ring-lime-900',
    dot: 'bg-lime-500',
  },
  BEHAVIOR: {
    label: 'Behavior',
    color: 'text-yellow-700 dark:text-yellow-300',
    bg: 'bg-yellow-50 dark:bg-yellow-950/40',
    ring: 'ring-yellow-200 dark:ring-yellow-900',
    dot: 'bg-yellow-500',
  },
  MOBILITY: {
    label: 'Mobility',
    color: 'text-stone-700 dark:text-stone-300',
    bg: 'bg-stone-100 dark:bg-stone-900/40',
    ring: 'ring-stone-200 dark:ring-stone-700',
    dot: 'bg-stone-500',
  },
  TRIAGE: {
    label: 'Triage',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/40',
    ring: 'ring-red-200 dark:ring-red-900',
    dot: 'bg-red-500',
  },
  UNKNOWN: {
    label: 'Other',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    ring: 'ring-border',
    dot: 'bg-muted-foreground',
  },
}

export function moduleMeta(key?: string | null) {
  if (!key) return MODULE_META.UNKNOWN
  return MODULE_META[key.toUpperCase()] ?? MODULE_META.UNKNOWN
}

/**
 * Booking status visual metadata.
 */
export const BOOKING_STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; ring: string; dot: string }
> = {
  PENDING: {
    label: 'Pending',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    ring: 'ring-amber-200 dark:ring-amber-900',
    dot: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    ring: 'ring-teal-200 dark:ring-teal-900',
    dot: 'bg-teal-500',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    ring: 'ring-emerald-200 dark:ring-emerald-900',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/40',
    ring: 'ring-red-200 dark:ring-red-900',
    dot: 'bg-red-500',
  },
  UNKNOWN: {
    label: 'Unknown',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    ring: 'ring-border',
    dot: 'bg-muted-foreground',
  },
}

export function bookingStatusMeta(status?: string | null) {
  if (!status) return BOOKING_STATUS_META.UNKNOWN
  return BOOKING_STATUS_META[status.toUpperCase()] ?? BOOKING_STATUS_META.UNKNOWN
}

const SPECIES_LABELS: Record<string, string> = {
  DOG: 'Dog',
  CAT: 'Cat',
  BIRD: 'Bird',
  RABBIT: 'Rabbit',
  RODENT: 'Rodent',
  REPTILE: 'Reptile',
  FISH: 'Fish',
}

export function speciesLabel(s?: string | null): string {
  if (!s) return '—'
  return SPECIES_LABELS[s.toUpperCase()] ?? s.charAt(0) + s.slice(1).toLowerCase()
}

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  ROUTINE: { label: 'Routine', color: 'text-muted-foreground' },
  OBSERVATION: { label: 'Observation', color: 'text-sky-700 dark:text-sky-300' },
  WARNING: { label: 'Warning', color: 'text-amber-700 dark:text-amber-300' },
  EMERGENCY: { label: 'Emergency', color: 'text-red-700 dark:text-red-300' },
}

export function severityMeta(s?: string | null) {
  if (!s) return { label: '—', color: 'text-muted-foreground' }
  return SEVERITY_META[s.toUpperCase()] ?? { label: s, color: 'text-muted-foreground' }
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────────────────────

export function ageYears(birth?: Date | string | null): number | null {
  if (!birth) return null
  const d = new Date(birth)
  if (isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  if (diff < 0) return 0
  return Math.max(0, Math.round((diff / (365.25 * 24 * 3600 * 1000)) * 10) / 10)
}

export function formatAge(birth?: Date | string | null): string {
  const age = ageYears(birth)
  if (age == null) return '—'
  if (age < 1) {
    const months = Math.max(0, Math.round(age * 12))
    return months <= 1 ? '1 mo' : `${months} mo`
  }
  return `${age} yr`
}

export function formatDate(d?: Date | string | null): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(d?: Date | string | null): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeTime(d?: Date | string | null): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  const diff = Date.now() - date.getTime()
  if (diff < 0) {
    // Future
    const absMins = Math.round(-diff / 60000)
    if (absMins < 60) return `in ${absMins}m`
    const absHours = Math.round(absMins / 60)
    if (absHours < 24) return `in ${absHours}h`
    const absDays = Math.round(absHours / 24)
    return `in ${absDays}d`
  }
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.round(months / 12)}y ago`
}

export function truncate(s: string | null | undefined, n = 140): string {
  if (!s) return ''
  const trimmed = s.replace(/\s+/g, ' ').trim()
  return trimmed.length > n ? trimmed.slice(0, n - 1).trimEnd() + '…' : trimmed
}

export function isFuture(date: Date | string): boolean {
  const t = new Date(date).getTime()
  if (isNaN(t)) return false
  return t > Date.now()
}

export function isUpcoming(date: Date | string, withinDays = 7): boolean {
  const t = new Date(date).getTime()
  if (isNaN(t)) return false
  const now = Date.now()
  const future = now + withinDays * 24 * 3600 * 1000
  return t >= now && t <= future
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
}

export const AI_DISCLAIMER =
  'AI summary is for clinical orientation only — not a substitute for professional veterinary assessment.'
