'use client'

/**
 * AI assessments feed — a reverse-chronological, cross-patient view of every
 * AI assessment logged in the system.
 *
 * Strategy: fetch `/api/pets` (only `_count`), then fetch `/api/pets/[id]` for
 * each pet in parallel to collect its `assessments[]`. Detail queries share
 * the cache key `['pet', petId]` with the patient table so both views stay in
 * sync and avoid duplicate network calls.
 *
 * Each row expands (shadcn Collapsible) to reveal full observations,
 * recommendations and escalation notes.
 *
 * SAFETY: every assessment carries the project-wide disclaimer reminding the
 * veterinarian that AI output is orientation only, not a diagnosis.
 */

import * as React from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ChevronDown,
  ClipboardList,
  PawPrint,
  ShieldAlert,
  Sparkles,
  Stethoscope,
} from 'lucide-react'

import { useApp } from '@/lib/store'
import { RISK_META } from '@/lib/store'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import {
  AI_DISCLAIMER,
  formatDate,
  initials,
  moduleMeta,
  relativeTime,
  speciesLabel,
  truncate,
  type AIAssessment,
  type PetDetail,
  type PetListItem,
} from './professional-meta'

interface AiAssessmentsFeedProps {
  className?: string
}

interface EnrichedAssessment extends AIAssessment {
  petName: string
  petSpecies: string
  petPhotoUrl?: string | null
  petBreed?: string | null
}

export function AiAssessmentsFeed({ className }: AiAssessmentsFeedProps) {
  const setSection = useApp((s) => s.setSection)
  const openPet = useApp((s) => s.openPet)

  const petsQuery = useQuery({
    queryKey: ['professional', 'pets'],
    queryFn: async () => {
      const r = await fetch('/api/pets')
      if (!r.ok) throw new Error('Failed to fetch patients')
      const data = (await r.json()) as { pets: PetListItem[] }
      return data.pets
    },
  })

  const detailQueries = useQueries({
    queries: (petsQuery.data ?? []).map((pet) => ({
      queryKey: ['pet', pet.id],
      queryFn: async () => {
        const r = await fetch(`/api/pets/${pet.id}`)
        if (!r.ok) throw new Error('Failed to fetch pet detail')
        const data = (await r.json()) as { pet: PetDetail }
        return data.pet
      },
      enabled: !!petsQuery.data,
      staleTime: 60_000,
    })),
  })

  const allAssessments: EnrichedAssessment[] = React.useMemo(() => {
    if (!petsQuery.data) return []
    const out: EnrichedAssessment[] = []
    petsQuery.data.forEach((pet, idx) => {
      const detail = detailQueries[idx]?.data
      if (!detail?.assessments?.length) return
      detail.assessments.forEach((a) => {
        out.push({
          ...a,
          petName: pet.name,
          petSpecies: pet.species,
          petPhotoUrl: pet.photoUrl ?? null,
          petBreed: pet.breed ?? null,
        })
      })
    })
    out.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    return out
  }, [petsQuery.data, detailQueries])

  const anyLoading =
    petsQuery.isLoading ||
    (petsQuery.data
      ? detailQueries.some((q) => q.isLoading)
      : false)

  if (anyLoading) {
    return <AssessmentsSkeleton />
  }

  if (petsQuery.isError) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <ShieldAlert className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Could not load AI assessments.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => petsQuery.refetch()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (allAssessments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Sparkles className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No AI assessments have been logged yet.
          </p>
          <p className="text-xs text-muted-foreground max-w-md">
            Once an owner runs a symptom triage or vision screening, the
            resulting AI observation will appear here for review.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Alert className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900">
        <Stethoscope className="size-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">
          Clinical orientation only
        </AlertTitle>
        <AlertDescription className="text-amber-800/90 dark:text-amber-200/80">
          {AI_DISCLAIMER}
        </AlertDescription>
      </Alert>

      <div className="max-h-[70vh] overflow-y-auto scroll-area-thin pr-1 -mr-1 flex flex-col gap-3">
        {allAssessments.map((a) => (
          <AssessmentRow
            key={a.id}
            assessment={a}
            onViewPet={() => {
              openPet(a.petId)
              setSection('pet-detail')
            }}
          />
        ))}
      </div>
    </div>
  )
}

interface AssessmentRowProps {
  assessment: EnrichedAssessment
  onViewPet: () => void
}

function AssessmentRow({ assessment, onViewPet }: AssessmentRowProps) {
  const [open, setOpen] = React.useState(false)
  const risk = RISK_META[assessment.riskLevel?.toUpperCase()] ?? RISK_META.UNKNOWN
  const mod = moduleMeta(assessment.module)
  const confidencePct = Math.round((assessment.confidence ?? 0) * 100)

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-xl border bg-card text-card-foreground shadow-sm"
    >
      <div className="p-4">
        {/* Top row: pet identity + date */}
        <div className="flex items-start gap-3">
          <Avatar className="size-10 ring-1 ring-border shrink-0">
            {assessment.petPhotoUrl ? (
              <AvatarImage
                src={assessment.petPhotoUrl}
                alt={assessment.petName}
              />
            ) : null}
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-medium">
              {initials(assessment.petName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onViewPet}
                className="font-semibold text-foreground hover:text-primary hover:underline underline-offset-2 truncate"
              >
                {assessment.petName}
              </button>
              <span className="text-xs text-muted-foreground">
                {speciesLabel(assessment.petSpecies)}
                {assessment.petBreed ? ` · ${assessment.petBreed}` : ''}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {formatDate(assessment.createdAt)} ·{' '}
              {relativeTime(assessment.createdAt)}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                'gap-1 ring-1',
                mod.color,
                mod.bg,
                mod.ring,
                'border-transparent',
              )}
            >
              <span className={cn('size-1.5 rounded-full', mod.dot)} />
              {mod.label}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'gap-1 ring-1',
                risk.color,
                risk.bg,
                risk.ring,
                'border-transparent',
              )}
            >
              <span className={cn('size-1.5 rounded-full bg-current opacity-80')} />
              {risk.label}
            </Badge>
          </div>
        </div>

        {/* Observation excerpt */}
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {assessment.observations
            ? truncate(assessment.observations, 220)
            : 'No observation recorded.'}
        </p>

        {/* Confidence + expand toggle */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-muted-foreground/50" />
              Confidence
            </span>
            <span className="font-mono tabular-nums text-foreground/80">
              {confidencePct}%
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="font-mono text-[10px] text-muted-foreground/70 truncate max-w-32">
              {assessment.id}
            </span>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 h-9 gap-1 text-xs"
            >
              {open ? (
                <>
                  Hide details
                  <ChevronDown className="size-3.5 rotate-180 transition-transform" />
                </>
              ) : (
                <>
                  View details
                  <ChevronDown className="size-3.5 transition-transform" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent>
        <div className="border-t bg-muted/30 px-4 py-4 flex flex-col gap-4">
          <AssessmentSection
            icon={<ClipboardList className="size-3.5" />}
            title="Observations"
          >
            {assessment.observations || 'No observation recorded.'}
          </AssessmentSection>

          {assessment.inputText ? (
            <AssessmentSection
              icon={<PawPrint className="size-3.5" />}
              title="Owner input"
              tone="muted"
            >
              {assessment.inputText}
            </AssessmentSection>
          ) : null}

          <AssessmentSection
            icon={<Stethoscope className="size-3.5" />}
            title="Recommendations"
          >
            {assessment.recommendations || 'No recommendations recorded.'}
          </AssessmentSection>

          {assessment.escalation ? (
            <AssessmentSection
              icon={<AlertTriangle className="size-3.5" />}
              title="Escalation"
              tone="warning"
            >
              {assessment.escalation}
            </AssessmentSection>
          ) : null}

          <div className="flex items-center justify-end pt-1">
            <Button variant="outline" size="sm" onClick={onViewPet} className="min-h-11 h-9">
              Open {assessment.petName}'s record
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function AssessmentSection({
  icon,
  title,
  children,
  tone = 'default',
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  tone?: 'default' | 'muted' | 'warning'
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide',
          tone === 'warning'
            ? 'text-amber-700 dark:text-amber-300'
            : 'text-muted-foreground',
        )}
      >
        {icon}
        {title}
      </div>
      <div
        className={cn(
          'text-sm leading-relaxed',
          tone === 'muted' ? 'text-muted-foreground italic' : 'text-foreground/90',
        )}
      >
        {children}
      </div>
    </div>
  )
}

function AssessmentsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 w-full rounded-xl" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  )
}
