'use client'

// Ariquo — Owner dashboard home (overview).
// Summary cards, pet grid, upcoming reminders, quick actions.

import { useMemo, useState } from 'react'
import {
  Activity,
  BellRing,
  CalendarClock,
  Camera,
  CirclePlus,
  PawPrint,
  Stethoscope,
  TriangleAlert,
  Sparkles,
  ChevronRight,
  CircleAlert,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AddPetDialog } from '@/components/dashboard/add-pet-dialog'
import { useApp } from '@/lib/store'
import {
  usePetDetails,
  usePets,
  useToggleReminder,
} from '@/lib/pet-hooks'
import {
  AI_DISCLAIMER,
  calcAge,
  formatDate,
  initials,
  isOverdue,
  isWithinNextDays,
  relativeDays,
  reminderTypeMeta,
  speciesEmoji,
  speciesLabel,
  statusMeta,
  type Pet,
  type PetDetail,
} from '@/lib/pet-utils'
import { cn } from '@/lib/utils'

export function DashboardHome() {
  const { data: petsData, isLoading, error } = usePets()
  const pets = petsData?.pets ?? []
  const { details, isLoading: detailsLoading } = usePetDetails(
    pets.map((p) => p.id),
  )
  const [addOpen, setAddOpen] = useState(false)

  const upcoming = useMemo(() => {
    const all = details.flatMap((p) =>
      (p.reminders ?? [])
        .filter((r) => !r.done)
        .map((r) => ({
          ...r,
          petName: p.name,
          petPhotoUrl: p.photoUrl ?? null,
          petSpecies: p.species,
        })),
    )
    return all.sort(
      (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
    )
  }, [details])

  const activeMedCount = useMemo(
    () =>
      details.reduce(
        (n, p) => n + (p.medications ?? []).filter((m) => m.active).length,
        0,
      ),
    [details],
  )

  const aiThisMonth = useMemo(() => {
    const now = new Date()
    return details.reduce((n, p) => {
      return (
        n +
        (p.assessments ?? []).filter((a) => {
          const d = new Date(a.createdAt)
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          )
        }).length
      )
    }, 0)
  }, [details])

  const upcomingNext30 = useMemo(
    () =>
      upcoming.filter(
        (r) =>
          isWithinNextDays(r.dueAt, 30) || isOverdue(r.dueAt),
      ).length,
    [upcoming],
  )

  if (isLoading) return <DashboardSkeleton />
  if (error) {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Couldn&apos;t load your dashboard</AlertTitle>
        <AlertDescription>
          {(error as Error).message || 'Please refresh the page to try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  if (pets.length === 0) {
    return (
      <EmptyDashboard
        onAdd={() => setAddOpen(true)}
        addOpen={addOpen}
        onAddOpenChange={setAddOpen}
      />
    )
  }

  return (
    <div className="grid gap-6">
      <Header petsCount={pets.length} onAdd={() => setAddOpen(true)} />

      {/* Summary cards */}
      <section
        aria-label="Summary"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <SummaryCard
          icon={<PawPrint className="size-5" />}
          label="Your pets"
          value={pets.length}
          accent="primary"
        />
        <SummaryCard
          icon={<CalendarClock className="size-5" />}
          label="Upcoming in 30 days"
          value={upcomingNext30}
          accent={upcomingNext30 > 0 ? 'amber' : 'muted'}
        />
        <SummaryCard
          icon={<Activity className="size-5" />}
          label="Active medications"
          value={activeMedCount}
          accent="primary"
        />
        <SummaryCard
          icon={<Sparkles className="size-5" />}
          label="AI assessments this month"
          value={aiThisMonth}
          accent={aiThisMonth > 0 ? 'coral' : 'muted'}
        />
      </section>

      {/* Quick actions */}
      <QuickActions />

      {/* Pets grid + Upcoming reminders */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SubHeader
            title="Your pets"
            subtitle="Tap a pet to open their full record."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
            <AddPetCard onClick={() => setAddOpen(true)} />
          </div>
        </div>

        <div>
          <SubHeader
            title="Upcoming reminders"
            subtitle="Across all your pets, soonest first."
          />
          <UpcomingReminders items={upcoming} loading={detailsLoading} />
        </div>
      </section>

      <AddPetDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}

// ─────────────────────────────────────────────
//  Header
// ─────────────────────────────────────────────

function Header({
  petsCount,
  onAdd,
}: {
  petsCount: number
  onAdd: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-radial-fade">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Welcome back
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Your pets, in one calm place.
            </h1>
            <p className="max-w-prose text-sm text-muted-foreground">
              {petsCount === 1
                ? 'One pet in your care. Open their record below.'
                : `${petsCount} pets in your care. Tap any pet to open their lifelong record.`}
            </p>
          </div>
          <Button
            onClick={onAdd}
            className="h-11 gap-2 self-start sm:self-auto"
            size="lg"
          >
            <CirclePlus className="size-4" />
            Add a pet
          </Button>
        </CardContent>
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────
//  Summary cards
// ─────────────────────────────────────────────

type Accent = 'primary' | 'amber' | 'coral' | 'muted'

const accentMap: Record<Accent, string> = {
  primary: 'text-primary bg-primary/10',
  amber: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40',
  coral: 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/40',
  muted: 'text-muted-foreground bg-muted',
}

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: Accent
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="flex items-center gap-3 p-4 sm:p-5">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              accentMap[accent],
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-semibold tabular-nums leading-none">
              {value}
            </div>
            <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {label}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
//  Quick actions
// ─────────────────────────────────────────────

function QuickActions() {
  const setSection = useApp((s) => s.setSection)
  const actions: {
    title: string
    desc: string
    icon: React.ReactNode
    onClick: () => void
    accent: Accent
  }[] = [
    {
      title: 'AI symptom triage',
      desc: 'Describe a concern, get a screening.',
      icon: <Stethoscope className="size-5" />,
      onClick: () => setSection('ai-triage'),
      accent: 'amber',
    },
    {
      title: 'Vision AI analysis',
      desc: 'Skin, eyes, ears, dental photos.',
      icon: <Camera className="size-5" />,
      onClick: () => setSection('ai-vision'),
      accent: 'coral',
    },
    {
      title: 'Find a vet',
      desc: 'Browse the marketplace.',
      icon: <PawPrint className="size-5" />,
      onClick: () => setSection('marketplace'),
      accent: 'primary',
    },
    {
      title: 'Add a new pet',
      desc: 'Create a lifelong profile.',
      icon: <CirclePlus className="size-5" />,
      onClick: () => setSection('pets'),
      accent: 'muted',
    },
  ]

  return (
    <section
      aria-label="Quick actions"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {actions.map((a) => (
        <motion.button
          key={a.title}
          type="button"
          onClick={a.onClick}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
        >
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-lg',
              accentMap[a.accent],
            )}
          >
            {a.icon}
          </div>
          <div>
            <div className="text-sm font-medium leading-tight">{a.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {a.desc}
            </div>
          </div>
          <ChevronRight className="size-4 self-end text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </motion.button>
      ))}
    </section>
  )
}

// ─────────────────────────────────────────────
//  Pet card
// ─────────────────────────────────────────────

function PetCard({ pet }: { pet: Pet }) {
  const openPet = useApp((s) => s.openPet)
  const status = statusMeta(pet.status)
  const counts = pet._count

  return (
    <motion.button
      type="button"
      onClick={() => openPet(pet.id)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-colors hover:border-primary/40"
      aria-label={`Open ${pet.name}'s record`}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {pet.photoUrl ? (
          <img
            src={pet.photoUrl}
            alt={`${pet.name}, a ${speciesLabel(pet.species).toLowerCase()}`}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/30 text-3xl">
            {speciesEmoji(pet.species)}
          </div>
        )}
        <span
          className={cn(
            'absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shadow-sm',
            status.className,
          )}
        >
          <span className={cn('size-1.5 rounded-full', status.dot)} />
          {status.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold leading-tight">
              {pet.name}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {speciesLabel(pet.species)}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </p>
          </div>
          <Avatar className="size-8 ring-1 ring-border">
            <AvatarImage src={pet.photoUrl ?? undefined} alt={pet.name} />
            <AvatarFallback className="text-xs">
              {initials(pet.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="Age" value={calcAge(pet.birthDate)} />
          <Stat
            label="Weight"
            value={pet.weightKg != null ? `${pet.weightKg} kg` : '—'}
          />
          <Stat
            label="Vaccines"
            value={counts?.vaccines != null ? String(counts.vaccines) : '—'}
          />
          <Stat
            label="Reminders"
            value={counts?.reminders != null ? String(counts.reminders) : '—'}
          />
        </div>

        <div className="mt-auto flex items-center justify-end text-xs font-medium text-primary">
          Open record
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </motion.button>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="truncate text-sm font-medium">{value}</div>
    </div>
  )
}

function AddPetCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/50 p-6 text-center transition-colors hover:border-primary/50 hover:bg-accent/30"
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CirclePlus className="size-5" />
      </div>
      <div className="text-sm font-medium">Add a new pet</div>
      <div className="max-w-[12rem] text-xs text-muted-foreground">
        Start their lifelong digital record in under a minute.
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────
//  Upcoming reminders
// ─────────────────────────────────────────────

interface UpcomingItem {
  id: string
  petId: string
  petName: string
  petPhotoUrl: string | null
  petSpecies: string
  title: string
  type: string
  dueAt: string
  done: boolean
}

function UpcomingReminders({
  items,
  loading,
}: {
  items: UpcomingItem[]
  loading: boolean
}) {
  if (loading && items.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <BellRing className="size-5" />
          </div>
          <div className="text-sm font-medium">You&apos;re all caught up</div>
          <p className="text-xs text-muted-foreground">
            No open reminders. We&apos;ll surface anything due soon here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto scroll-area-thin">
          {items.slice(0, 12).map((r) => (
            <UpcomingRow key={`${r.petId}-${r.id}`} reminder={r} />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function UpcomingRow({ reminder }: { reminder: UpcomingItem }) {
  const overdue = isOverdue(reminder.dueAt)
  const soon = isWithinNextDays(reminder.dueAt, 14) && !overdue
  const meta = reminderTypeMeta(reminder.type)

  return (
    <ReminderRowInner
      reminder={reminder}
      overdue={overdue}
      soon={soon}
      meta={meta}
    />
  )
}

function ReminderRowInner({
  reminder,
  overdue,
  soon,
  meta,
}: {
  reminder: UpcomingItem
  overdue: boolean
  soon: boolean
  meta: ReturnType<typeof reminderTypeMeta>
}) {
  const mut = useToggleReminder(reminder.petId)

  function onCheck(checked: boolean | 'indeterminate') {
    if (checked === 'indeterminate') return
    mut.mutate(
      {
        reminderId: reminder.id,
        done: checked,
        title: reminder.title,
        type: reminder.type,
        dueAt: reminder.dueAt,
      },
      {
        onError: (err: Error) =>
          toast.error(err.message || 'Failed to update reminder'),
      },
    )
  }

  return (
    <li
      className={cn(
        'flex items-start gap-3 p-3 transition-colors hover:bg-muted/40',
        overdue && 'bg-red-50/50 dark:bg-red-950/10',
        soon && !overdue && 'bg-amber-50/40 dark:bg-amber-950/10',
      )}
    >
      <Checkbox
        checked={reminder.done}
        onCheckedChange={onCheck}
        disabled={mut.isPending}
        className="mt-0.5"
        aria-label={`Mark ${reminder.title} as ${reminder.done ? 'open' : 'done'}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{reminder.title}</span>
          <Badge variant="outline" className={cn('px-1.5 py-0', meta.className)}>
            {meta.label}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Avatar className="size-4 ring-1 ring-border">
            <AvatarImage
              src={reminder.petPhotoUrl ?? undefined}
              alt={reminder.petName}
            />
            <AvatarFallback className="text-[8px]">
              {initials(reminder.petName)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{reminder.petName}</span>
          <span aria-hidden>·</span>
          <span
            className={cn(
              'font-medium',
              overdue && 'text-red-700 dark:text-red-300',
              soon && !overdue && 'text-amber-700 dark:text-amber-300',
            )}
          >
            {formatDate(reminder.dueAt, 'MMM d')}
          </span>
          <span className="text-muted-foreground/70">
            ({relativeDays(reminder.dueAt)})
          </span>
        </div>
      </div>
      {overdue && (
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
      )}
    </li>
  )
}

// ─────────────────────────────────────────────
//  Empty state
// ─────────────────────────────────────────────

function EmptyDashboard({
  onAdd,
  addOpen,
  onAddOpenChange,
}: {
  onAdd: () => void
  addOpen: boolean
  onAddOpenChange: (open: boolean) => void
}) {
  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden">
        <div className="bg-radial-fade">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:p-12">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <PawPrint className="size-7" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome to Ariquo
            </h2>
            <p className="max-w-prose text-sm text-muted-foreground">
              The operating system for animal life. Add your first pet to start
              their lifelong digital record — identity, health timeline, AI
              observation and triage, preventive care and a connected
              marketplace.
            </p>
            <Button onClick={onAdd} size="lg" className="mt-2 h-11 gap-2">
              <CirclePlus className="size-4" />
              Add your first pet
            </Button>
          </CardContent>
        </div>
      </Card>

      <Alert>
        <Sparkles className="size-4" />
        <AlertTitle>A note on AI in Ariquo</AlertTitle>
        <AlertDescription>{AI_DISCLAIMER}</AlertDescription>
      </Alert>

      <AddPetDialog open={addOpen} onOpenChange={onAddOpenChange} />
    </div>
  )
}

// ─────────────────────────────────────────────
//  Skeleton + small helpers
// ─────────────────────────────────────────────

function SubHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-3 flex flex-col gap-0.5">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl xl:col-span-1" />
      </div>
    </div>
  )
}

// Re-export for type usage in siblings (e.g. pet-list reuse).
export type { PetDetail }
