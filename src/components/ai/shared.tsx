'use client'

import * as React from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Markdown from 'react-markdown'
import {
  AlertTriangle,
  Bird,
  Cat,
  Check,
  Dog,
  Fish,
  Loader2,
  PawPrint,
  Rabbit,
  ShieldAlert,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { RISK_META, useApp } from '@/lib/store'

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

export interface Pet {
  id: string
  name: string
  species: string
  breed?: string | null
  sex?: string | null
  birthDate?: string | null
  weightKg?: number | null
  photoUrl?: string | null
  neutered?: boolean
  allergies?: string | null
  _count?: {
    events?: number
    vaccines?: number
    medications?: number
    reminders?: number
    assessments?: number
  }
}

export type RiskLevel =
  | 'OBSERVATION'
  | 'MONITOR'
  | 'VET_SOON'
  | 'EMERGENCY'
  | 'UNKNOWN'

export interface AiResult {
  observations: string
  riskLevel: RiskLevel
  confidence: number
  recommendations: string
  escalation?: string | null
  disclaimer: string
}

export interface ChatMessageData {
  role: 'user' | 'assistant'
  content: string
}

// ─────────────────────────────────────────────
//  QueryClient singleton + provider wrapper
//  (Self-contained so AI views work whether or
//   not the host app already wraps them.)
// ─────────────────────────────────────────────

let _queryClient: QueryClient | null = null
function getQueryClient() {
  if (!_queryClient) {
    _queryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
      },
    })
  }
  return _queryClient
}

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => getQueryClient())
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

export const DISCLAIMER_TEXT =
  'Ariquo AI provides observation and screening only — not a definitive veterinary diagnosis. When in doubt, contact your veterinarian.'

const SPECIES_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  DOG: Dog,
  CAT: Cat,
  RABBIT: Rabbit,
  BIRD: Bird,
  FISH: Fish,
}

function speciesIcon(species: string) {
  return SPECIES_ICON[species] ?? PawPrint
}

// ─────────────────────────────────────────────
//  Pet fetching hook
// ─────────────────────────────────────────────

export function usePets() {
  return useQuery<Pet[]>({
    queryKey: ['pets'],
    queryFn: async () => {
      const res = await fetch('/api/pets')
      if (!res.ok) throw new Error('Failed to load pets')
      const data = (await res.json()) as { pets: Pet[] }
      return data.pets
    },
  })
}

/**
 * useSelectedPet — returns the active pet ID, defaulting to the
 * first pet returned by /api/pets when useApp.activePetId is null.
 */
export function useSelectedPet(): readonly [string | null, (id: string) => void] {
  const activePetId = useApp((s) => s.activePetId)
  const { data: pets } = usePets()
  const [selected, setSelected] = React.useState<string | null>(activePetId ?? null)

  React.useEffect(() => {
    if (!selected && pets && pets.length > 0) {
      setSelected(pets[0].id)
    }
  }, [selected, pets])

  React.useEffect(() => {
    if (activePetId) setSelected(activePetId)
  }, [activePetId])

  return [selected, setSelected] as const
}

// ─────────────────────────────────────────────
//  PetPicker
// ─────────────────────────────────────────────

export function PetPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (id: string) => void
}) {
  const { data, isLoading, error } = usePets()
  const pets = data ?? []

  if (isLoading) {
    return (
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        aria-busy="true"
        aria-label="Loading pets"
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[68px] animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Couldn&apos;t load pets</AlertTitle>
        <AlertDescription>Please reload the page to try again.</AlertDescription>
      </Alert>
    )
  }

  if (pets.length === 0) {
    return (
      <Alert>
        <PawPrint className="h-4 w-4" />
        <AlertTitle>No pets yet</AlertTitle>
        <AlertDescription>
          Add a pet to your profile to start using Ariquo&apos;s AI features.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Select a pet"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      {pets.map((pet) => {
        const Icon = speciesIcon(pet.species)
        const selected = pet.id === value
        return (
          <button
            type="button"
            key={pet.id}
            role="radio"
            aria-checked={selected}
            aria-label={`Select ${pet.name}, ${pet.species.toLowerCase()}${pet.breed ? `, ${pet.breed}` : ''}`}
            onClick={() => onChange(pet.id)}
            className={cn(
              'group relative flex min-h-[68px] items-center gap-3 rounded-lg border p-3 text-left transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              selected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30',
            )}
          >
            <Avatar className="size-10 shrink-0">
              {pet.photoUrl ? (
                <AvatarImage src={pet.photoUrl} alt="" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary">
                <Icon className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{pet.name}</div>
              <div className="truncate text-xs capitalize text-muted-foreground">
                {pet.species.toLowerCase()}
                {pet.breed ? ` · ${pet.breed}` : ''}
              </div>
            </div>
            {selected && (
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                aria-hidden="true"
              >
                <Check className="size-3" strokeWidth={3} />
              </motion.span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
//  AiDisclaimer
// ─────────────────────────────────────────────

export function AiDisclaimer({ className }: { className?: string }) {
  return (
    <Alert className={cn('border-dashed bg-muted/40', className)}>
      <ShieldAlert className="h-4 w-4 text-muted-foreground" />
      <AlertDescription className="text-xs text-muted-foreground">
        {DISCLAIMER_TEXT}
      </AlertDescription>
    </Alert>
  )
}

// ─────────────────────────────────────────────
//  RiskBadge
// ─────────────────────────────────────────────

export function RiskBadge({ level }: { level: RiskLevel }) {
  const meta = RISK_META[level] ?? RISK_META.UNKNOWN
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
        meta.bg,
        meta.color,
        meta.ring,
      )}
    >
      {level === 'EMERGENCY' && <AlertTriangle className="size-3.5" />}
      <span>{meta.label}</span>
    </span>
  )
}

// ─────────────────────────────────────────────
//  RiskResultCard
// ─────────────────────────────────────────────

function ResultSection({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

export function RiskResultCard({
  result,
  className,
}: {
  result: AiResult
  className?: string
}) {
  const meta = RISK_META[result.riskLevel] ?? RISK_META.UNKNOWN
  const confidencePct = Math.round((result.confidence ?? 0) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('w-full', className)}
    >
      <Card className={cn('gap-0 overflow-hidden border py-0 ring-1', meta.bg, meta.ring)}>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <RiskBadge level={result.riskLevel} />
            <div className="text-xs text-muted-foreground">
              Confidence{' '}
              <span className={cn('font-semibold', meta.color)}>{confidencePct}%</span>
            </div>
          </div>

          {/* observations */}
          <ResultSection
            title="Observations"
            icon={<Sparkles className="size-3.5" />}
          >
            <div className="ai-output">
              <Markdown>{result.observations}</Markdown>
            </div>
          </ResultSection>

          {/* recommendations */}
          <ResultSection
            title="Recommendations"
            icon={<Stethoscope className="size-3.5" />}
          >
            <div className="ai-output">
              <Markdown>{result.recommendations}</Markdown>
            </div>
          </ResultSection>

          {/* escalation */}
          {result.escalation ? (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">
                When to escalate
              </AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                {result.escalation}
              </AlertDescription>
            </Alert>
          ) : null}

          <AiDisclaimer />
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
//  ChatMessage
// ─────────────────────────────────────────────

export function ChatMessage({
  role,
  content,
}: {
  role: 'user' | 'assistant'
  content: string
}) {
  const isUser = role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-start gap-2.5',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <Avatar className="size-8 shrink-0">
        {isUser ? (
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            You
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-accent text-accent-foreground">
            <PawPrint className="size-4" />
          </AvatarFallback>
        )}
      </Avatar>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-tl-sm border bg-card text-card-foreground',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <div className="ai-output">
            <Markdown>{content}</Markdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
//  ChatTypingIndicator
// ─────────────────────────────────────────────

export function ChatTypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="bg-accent text-accent-foreground">
          <PawPrint className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="rounded-2xl rounded-tl-sm border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Thinking…</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  AiLoading — full card skeleton for triage/vision
// ─────────────────────────────────────────────

export function AiLoading({ label = 'Analyzing…' }: { label?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          This can take 15–25 seconds.
        </p>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
//  EmptyState
// ─────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <Card className="border-dashed bg-muted/30">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="space-y-1">
          <div className="text-base font-semibold">{title}</div>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
//  SectionHeader — title + subhead used by AI views
// ─────────────────────────────────────────────

export function SectionHeader({
  icon,
  title,
  subhead,
}: {
  icon: React.ReactNode
  title: string
  subhead: string
}) {
  return (
    <header className="space-y-1.5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground">{subhead}</p>
    </header>
  )
}

// ─────────────────────────────────────────────
//  Chip — suggestion pill button
// ─────────────────────────────────────────────

export function Chip({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-accent/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  )
}
