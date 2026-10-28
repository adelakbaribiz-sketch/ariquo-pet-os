'use client'

/**
 * AI summary dialog — opens on demand from the patient table.
 *
 * When opened for a given petId, it:
 *   1. Fetches the full pet record from `/api/pets/[id]` (cache key `['pet', petId]`,
 *      shared with the rest of the dashboard).
 *   2. Triggers `POST /api/ai/summary` to generate a longitudinal AI clinical
 *      summary. This call can take 15–25 seconds — the dialog shows a clear
 *      loading state so the vet knows what to expect.
 *
 * The AI summary is rendered with react-markdown inside `.ai-output`. Below the
 * summary we surface a compact longitudinal events feed and a small weight
 * trend chart (recharts). A disclaimer alert is always pinned at the bottom.
 *
 * SAFETY: the summary is clinical orientation only — never a diagnosis.
 */

import * as React from 'react'
import { apiError } from '@/lib/api-error'
import { useQuery } from '@tanstack/react-query'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ReactMarkdown from 'react-markdown'
import {
  Activity,
  CalendarDays,
  FlaskConical,
  Info,
  Loader2,
  Pill,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
  Syringe,
  Weight,
} from 'lucide-react'

import { RISK_META } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import {
  AI_DISCLAIMER,
  ageYears,
  formatDate,
  formatDateTime,
  formatAge,
  initials,
  moduleMeta,
  relativeTime,
  speciesLabel,
  truncate,
  type AIAssessment,
  type MedicalEvent,
  type PetDetail,
  type WeightLog,
} from './professional-meta'

interface AiSummaryDialogProps {
  petId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EVENT_TYPE_ICON: Record<string, React.ReactNode> = {
  VACCINATION: <Syringe className="size-3.5" />,
  VACCINE: <Syringe className="size-3.5" />,
  MEDICATION: <Pill className="size-3.5" />,
  LAB: <FlaskConical className="size-3.5" />,
  IMAGING: <Activity className="size-3.5" />,
  SURGERY: <Stethoscope className="size-3.5" />,
  VISIT: <Stethoscope className="size-3.5" />,
  SYMPTOM: <Activity className="size-3.5" />,
  PROCEDURE: <Stethoscope className="size-3.5" />,
  NOTE: <Info className="size-3.5" />,
}

function eventIcon(type?: string) {
  if (!type) return <Info className="size-3.5" />
  return EVENT_TYPE_ICON[type.toUpperCase()] ?? <Info className="size-3.5" />
}

export function AiSummaryDialog({
  petId,
  open,
  onOpenChange,
}: AiSummaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="size-5 text-primary" />
            AI longitudinal summary
          </DialogTitle>
          <DialogDescription className="text-xs">
            Auto-generated clinical orientation from this patient&apos;s
            longitudinal record.
          </DialogDescription>
        </DialogHeader>

        {petId ? (
          <AiSummaryBody petId={petId} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-12 text-sm text-muted-foreground">
            No patient selected.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AiSummaryBody({ petId }: { petId: string }) {
  const petQuery = useQuery({
    queryKey: ['pet', petId],
    queryFn: async () => {
      const r = await fetch(`/api/pets/${petId}`)
      if (!r.ok) throw new Error('Failed to fetch pet detail')
      const data = (await r.json()) as { pet: PetDetail }
      return data.pet
    },
    staleTime: 60_000,
  })

  const summaryQuery = useQuery({
    queryKey: ['ai-summary', petId],
    queryFn: async () => {
      const r = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId }),
      })
      if (!r.ok) throw await apiError(r, 'Failed to generate AI summary')
      const data = (await r.json()) as { summary: string }
      return data.summary
    },
    // AI summary is deterministic for the same record; cache aggressively.
    staleTime: Infinity,
    retry: 1,
  })

  const pet = petQuery.data

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Pet header */}
      <div className="px-6 py-4 border-b bg-muted/30">
        {petQuery.isLoading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        ) : pet ? (
          <PetHeader pet={pet} />
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldAlert className="size-4" />
            Could not load patient record.
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto scroll-area-thin">
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* AI summary block */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Stethoscope className="size-4 text-primary" />
                AI clinical summary
              </h3>
              {summaryQuery.isSuccess ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 min-h-9 gap-1.5 text-xs"
                  onClick={() => summaryQuery.refetch()}
                  disabled={summaryQuery.isFetching}
                >
                  <RefreshCw
                    className={cn(
                      'size-3.5',
                      summaryQuery.isFetching && 'animate-spin',
                    )}
                  />
                  Regenerate
                </Button>
              ) : null}
            </div>

            {summaryQuery.isLoading ? (
              <SummaryLoading />
            ) : summaryQuery.isError ? (
              <SummaryError
                message={summaryQuery.error?.message}
                onRetry={() => summaryQuery.refetch()}
              />
            ) : summaryQuery.data ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="ai-output">
                  <ReactMarkdown>{summaryQuery.data}</ReactMarkdown>
                </div>
              </div>
            ) : null}
          </section>

          {/* Weight trend chart */}
          {pet && pet.weightLogs && pet.weightLogs.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Weight className="size-4 text-primary" />
                Weight trend
              </h3>
              <WeightChart logs={pet.weightLogs} species={pet.species} />
            </section>
          ) : null}

          {/* Longitudinal events feed */}
          {pet ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Activity className="size-4 text-primary" />
                Longitudinal events
                <Badge variant="secondary" className="tabular-nums">
                  {pet.events?.length ?? 0}
                </Badge>
              </h3>
              <EventsFeed
                events={pet.events ?? []}
                assessments={pet.assessments ?? []}
              />
            </section>
          ) : null}
        </div>
      </div>

      {/* Disclaimer footer */}
      <div className="border-t bg-background px-6 py-3">
        <Alert className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900 py-2.5">
          <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200 text-xs">
            Clinical orientation only
          </AlertTitle>
          <AlertDescription className="text-amber-800/90 dark:text-amber-200/80 text-xs">
            {AI_DISCLAIMER}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

function PetHeader({ pet }: { pet: PetDetail }) {
  const age = ageYears(pet.birthDate)
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-12 ring-1 ring-border">
        {pet.photoUrl ? <AvatarImage src={pet.photoUrl} alt={pet.name} /> : null}
        <AvatarFallback className="bg-accent text-accent-foreground">
          {initials(pet.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">{pet.name}</h2>
          <Badge variant="outline" className="text-[10px]">
            {speciesLabel(pet.species)}
          </Badge>
          {pet.sex ? (
            <Badge variant="secondary" className="text-[10px]">
              {pet.sex === 'MALE'
                ? 'Male'
                : pet.sex === 'FEMALE'
                ? 'Female'
                : 'Sex unknown'}
            </Badge>
          ) : null}
          {pet.neutered ? (
            <Badge variant="secondary" className="text-[10px]">
              Neutered
            </Badge>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {pet.breed ? <span>{pet.breed}</span> : null}
          {pet.birthDate ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              {formatAge(pet.birthDate)} old
            </span>
          ) : null}
          {pet.weightKg != null ? (
            <span className="inline-flex items-center gap-1">
              <Weight className="size-3" />
              {pet.weightKg} kg
            </span>
          ) : null}
          {pet.allergies ? (
            <span className="inline-flex items-center gap-1 text-orange-700 dark:text-orange-300">
              <ShieldAlert className="size-3" />
              Allergies: {pet.allergies}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SummaryLoading() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-5">
      <div className="flex items-center gap-2.5 text-sm font-medium text-primary">
        <Loader2 className="size-4 animate-spin" />
        Generating AI summary…
      </div>
      <p className="text-xs text-muted-foreground">
        This call to the language model can take <strong>15–25 seconds</strong>.
        The summary is assembled from the patient&apos;s longitudinal record and
        is intended for clinical orientation only.
      </p>
      <div className="mt-1 w-full flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-9/12" />
        <Skeleton className="h-3 w-10/12" />
      </div>
    </div>
  )
}

function SummaryError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <ShieldAlert className="size-4" />
      <AlertTitle>Could not generate AI summary</AlertTitle>
      <AlertDescription>
        {message || 'The AI service is unavailable or returned an error.'} You can retry — if
        the issue persists, please fall back to the longitudinal record below.
      </AlertDescription>
      <div className="col-start-2 mt-2">
        <Button variant="outline" size="sm" onClick={onRetry} className="min-h-9 h-9">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </div>
    </Alert>
  )
}

function WeightChart({ logs, species }: { logs: WeightLog[]; species: string }) {
  const data = React.useMemo(
    () =>
      logs
        .map((l) => ({
          date: new Date(l.loggedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: '2-digit',
          }),
          weight: Number(l.weightKg.toFixed(2)),
        })),
    [logs],
  )

  const unit = species.toUpperCase() === 'CAT' ? 'kg' : 'kg'

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              tickLine={false}
              axisLine={false}
              width={42}
              unit={unit}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 12,
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
              formatter={(value: number) => [`${value} ${unit}`, 'Weight']}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--chart-1)', stroke: 'var(--background)' }}
              activeDot={{ r: 5 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function EventsFeed({
  events,
  assessments,
}: {
  events: MedicalEvent[]
  assessments: AIAssessment[]
}) {
  // Merge events and assessments onto a single reverse-chronological timeline.
  const timeline = React.useMemo(() => {
    type Item =
      | { kind: 'event'; date: string; data: MedicalEvent }
      | { kind: 'assessment'; date: string; data: AIAssessment }
    const items: Item[] = []
    events.forEach((e) =>
      items.push({ kind: 'event', date: e.date, data: e } as Item),
    )
    assessments.forEach((a) =>
      items.push({ kind: 'assessment', date: a.createdAt, data: a } as Item),
    )
    items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    return items
  }, [events, assessments])

  if (timeline.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
        No events or assessments recorded.
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2.5 max-h-72 overflow-y-auto scroll-area-thin pr-1 -mr-1">
      {timeline.map((item, idx) => {
        if (item.kind === 'event') {
          const ev = item.data
          return (
            <li
              key={`e-${ev.id}-${idx}`}
              className="flex items-start gap-2.5 rounded-md border bg-card px-3 py-2"
            >
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {eventIcon(ev.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground">
                    {ev.title}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0">
                    {ev.type}
                  </Badge>
                </div>
                {ev.notes ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {truncate(ev.notes, 160)}
                  </p>
                ) : null}
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  {formatDate(ev.date)} · {relativeTime(ev.date)}
                </span>
              </div>
            </li>
          )
        }
        const a = item.data
        const risk = RISK_META[a.riskLevel?.toUpperCase()] ?? RISK_META.UNKNOWN
        const mod = moduleMeta(a.module)
        return (
          <li
            key={`a-${a.id}-${idx}`}
            className={cn(
              'flex items-start gap-2.5 rounded-md border px-3 py-2 ring-1',
              risk.bg,
              risk.ring,
              'border-transparent',
            )}
          >
            <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-background/70">
              <Stethoscope className={cn('size-3.5', risk.color)} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-foreground">
                  AI · {mod.label}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] py-0 border-transparent ring-1',
                    risk.color,
                    risk.bg,
                    risk.ring,
                  )}
                >
                  {risk.label}
                </Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                {a.observations
                  ? truncate(a.observations, 160)
                  : 'No observation recorded.'}
              </p>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">
                {formatDateTime(a.createdAt)} · {relativeTime(a.createdAt)}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
