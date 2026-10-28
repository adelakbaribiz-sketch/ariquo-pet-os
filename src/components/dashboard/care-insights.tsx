'use client'

// Ariquo — owner dashboard insight panels.
// Everything here is derived from the pets' real records (/api/pets/[id]);
// nothing is mocked. Empty data renders calm empty states.

import { useMemo } from 'react'
import {
  Activity,
  CalendarCheck2,
  CirclePlus,
  ShieldCheck,
  Stethoscope,
  TriangleAlert,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { RISK_META, useApp } from '@/lib/store'
import { formatDate, initials, isOverdue, relativeDays, type PetDetail } from '@/lib/pet-utils'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
//  Hero
// ─────────────────────────────────────────────

function greeting(now: Date) {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardHero({
  pets,
  attentionCount,
  nextUp,
  onAdd,
}: {
  pets: { id: string; name: string; photoUrl?: string | null }[]
  attentionCount: number
  nextUp?: { title: string; petName: string; dueAt: string } | null
  onAdd: () => void
}) {
  const setSection = useApp((s) => s.setSection)
  const now = new Date()

  return (
    <section className="surface relative overflow-hidden">
      <div className="bg-brand-wash absolute inset-0" aria-hidden />
      <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {formatDate(now.toISOString(), 'EEEE, d MMMM')}
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting(now)}, Sara
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {pets.length} {pets.length === 1 ? 'pet' : 'pets'} in your care.{' '}
            {attentionCount > 0 ? (
              <span className="font-medium text-foreground">
                {attentionCount} {attentionCount === 1 ? 'item needs' : 'items need'} your attention.
              </span>
            ) : (
              <span className="font-medium text-foreground">Everything looks on track.</span>
            )}{' '}
            {nextUp
              ? `Next up: ${nextUp.title} for ${nextUp.petName}, ${relativeDays(nextUp.dueAt)}.`
              : null}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <div className="flex -space-x-2">
              {pets.slice(0, 4).map((p) => (
                <Avatar key={p.id} className="size-9 ring-2 ring-card">
                  <AvatarImage src={p.photoUrl ?? undefined} alt={p.name} className="object-cover" />
                  <AvatarFallback className="text-xs">{initials(p.name)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {pets.map((p) => p.name).join(' · ')}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-full bg-card/70 backdrop-blur"
            onClick={() => setSection('ai-triage')}
          >
            <Stethoscope className="size-4" />
            Check a symptom
          </Button>
          <Button className="h-10 gap-2 rounded-full" onClick={onAdd}>
            <CirclePlus className="size-4" />
            Add a pet
          </Button>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
//  Needs attention
// ─────────────────────────────────────────────

export interface AttentionItem {
  key: string
  petId: string
  petName: string
  petPhotoUrl: string | null
  title: string
  detail: string
  tone: 'danger' | 'warn' | 'info'
  action: 'book-vet' | 'open-pet'
}

const ATTENTION_RISKS = ['EMERGENCY', 'VET_SOON', 'MONITOR']

export function useAttentionItems(details: PetDetail[]): AttentionItem[] {
  return useMemo(() => {
    const items: AttentionItem[] = []
    for (const p of details) {
      const latest = [...(p.assessments ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0]
      if (latest && ATTENTION_RISKS.includes(latest.riskLevel)) {
        const meta = RISK_META[latest.riskLevel] ?? RISK_META.UNKNOWN
        items.push({
          key: `a-${latest.id}`,
          petId: p.id,
          petName: p.name,
          petPhotoUrl: p.photoUrl ?? null,
          title: meta.label,
          detail: latest.inputText ?? 'Latest AI screening',
          tone: latest.riskLevel === 'MONITOR' ? 'warn' : 'danger',
          action: latest.riskLevel === 'MONITOR' ? 'open-pet' : 'book-vet',
        })
      }
      for (const r of p.reminders ?? []) {
        if (!r.done && isOverdue(r.dueAt)) {
          items.push({
            key: `r-${r.id}`,
            petId: p.id,
            petName: p.name,
            petPhotoUrl: p.photoUrl ?? null,
            title: `${r.title} overdue`,
            detail: `Was due ${formatDate(r.dueAt, 'MMM d')} (${relativeDays(r.dueAt)})`,
            tone: 'warn',
            action: 'open-pet',
          })
        }
      }
    }
    return items
  }, [details])
}

const toneClass: Record<AttentionItem['tone'], string> = {
  danger: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900',
  warn: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900',
  info: 'bg-primary/10 text-primary ring-primary/20',
}

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  const openPet = useApp((s) => s.openPet)
  const setSection = useApp((s) => s.setSection)
  const setProviderFilter = useApp((s) => s.setProviderFilter)

  return (
    <section className="surface flex flex-col p-5">
      <PanelHeader
        icon={<TriangleAlert className="size-4" />}
        title="Needs attention"
        subtitle="From AI screenings and overdue care"
      />
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <p className="text-sm font-medium">Nothing flagged</p>
          <p className="max-w-[16rem] text-xs text-muted-foreground">
            No open AI flags or overdue reminders across your pets.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.slice(0, 4).map((it) => (
            <li key={it.key} className="flex items-start gap-3 rounded-xl border bg-background/60 p-3">
              <Avatar className="size-9 ring-1 ring-border">
                <AvatarImage src={it.petPhotoUrl ?? undefined} alt={it.petName} className="object-cover" />
                <AvatarFallback className="text-xs">{initials(it.petName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold">{it.petName}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium ring-1',
                      toneClass[it.tone],
                    )}
                  >
                    {it.title}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{it.detail}</p>
              </div>
              <Button
                size="sm"
                variant={it.action === 'book-vet' ? 'default' : 'ghost'}
                className="h-8 shrink-0 rounded-full px-3 text-xs"
                onClick={() => {
                  if (it.action === 'book-vet') {
                    setProviderFilter('VETERINARIAN')
                    setSection('marketplace')
                  } else {
                    openPet(it.petId)
                  }
                }}
              >
                {it.action === 'book-vet' ? 'Book vet' : 'Review'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────
//  Care activity chart (last 6 months)
// ─────────────────────────────────────────────

export function CareActivityChart({ details }: { details: PetDetail[] }) {
  const data = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString('en', { month: 'short' }),
        records: 0,
        vaccines: 0,
        ai: 0,
      }
    })
    const bucket = (iso: string) => {
      const d = new Date(iso)
      return months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`)
    }
    for (const p of details) {
      for (const e of p.events ?? []) {
        const b = bucket(e.date)
        if (b) b.records++
      }
      for (const v of p.vaccines ?? []) {
        const b = bucket(v.date)
        if (b) b.vaccines++
      }
      for (const a of p.assessments ?? []) {
        const b = bucket(a.createdAt)
        if (b) b.ai++
      }
    }
    return months
  }, [details])

  const total = data.reduce((n, m) => n + m.records + m.vaccines + m.ai, 0)

  return (
    <section className="surface flex flex-col p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHeader
          icon={<Activity className="size-4" />}
          title="Care activity"
          subtitle={`${total} entries added to the lifelong record in 6 months`}
        />
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <Legend color="var(--chart-1)" label="Health records" />
          <Legend color="var(--chart-2)" label="Vaccines" />
          <Legend color="var(--chart-3)" label="AI checks" />
        </div>
      </div>
      <div className="mt-4 h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="32%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={24}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 12,
                color: 'var(--popover-foreground)',
              }}
            />
            <Bar dataKey="records" name="Health records" stackId="a" fill="var(--chart-1)" />
            <Bar dataKey="vaccines" name="Vaccines" stackId="a" fill="var(--chart-2)" />
            <Bar dataKey="ai" name="AI checks" stackId="a" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
//  Upcoming appointments (from real bookings)
// ─────────────────────────────────────────────

interface BookingLite {
  id: string
  scheduledAt: string
  status: string
  notes?: string | null
  provider?: { name: string; type: string } | null
  service?: { name: string } | null
}

export function NextAppointments({ details }: { details: PetDetail[] }) {
  const setSection = useApp((s) => s.setSection)
  const upcoming = useMemo(() => {
    const now = Date.now()
    return details
      .flatMap((p) =>
        ((p.bookings ?? []) as BookingLite[]).map((b) => ({
          ...b,
          petName: p.name,
          petPhotoUrl: p.photoUrl ?? null,
        })),
      )
      .filter(
        (b) =>
          new Date(b.scheduledAt).getTime() >= now &&
          (b.status === 'PENDING' || b.status === 'CONFIRMED'),
      )
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  }, [details])

  return (
    <section className="surface p-5">
      <PanelHeader
        icon={<CalendarCheck2 className="size-4" />}
        title="Appointments"
        subtitle="Booked through the marketplace"
      />
      {upcoming.length === 0 ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-dashed p-4">
          <p className="text-xs text-muted-foreground">No upcoming appointments.</p>
          <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => setSection('marketplace')}>
            Find care
          </Button>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {upcoming.slice(0, 3).map((b) => {
            const d = new Date(b.scheduledAt)
            return (
              <li key={b.id} className="flex items-center gap-3 rounded-xl border bg-background/60 p-3">
                <div className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-primary/10 py-1.5 text-primary">
                  <span className="text-[10px] font-semibold uppercase">
                    {d.toLocaleString('en', { month: 'short' })}
                  </span>
                  <span className="font-display text-lg font-semibold leading-none">{d.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{b.provider?.name ?? 'Provider'}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {b.petName} · {b.service?.name ?? b.notes ?? 'Appointment'} ·{' '}
                    {d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-medium',
                    b.status === 'CONFIRMED'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                  )}
                >
                  {b.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────
//  Small shared bits
// ─────────────────────────────────────────────

function PanelHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex size-7 items-center justify-center rounded-lg bg-muted text-foreground/70">
        {icon}
      </div>
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

