'use client'

// Ariquo — Preventive care view.
// Per-pet reminders grouped by pet, with color coding for urgency,
// a "Preventive care schedule" explainer, and per-pet "Add reminder" buttons.

import { useMemo, useState } from 'react'
import {
  CalendarClock,
  CircleAlert,
  ClipboardPlus,
  Info,
  Pill,
  ShieldCheck,
  Stethoscope,
  Syringe,
  TriangleAlert,
  Scissors,
  Weight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  usePetDetails,
  usePets,
  useToggleReminder,
  useAddReminder,
} from '@/lib/pet-hooks'
import {
  REMINDER_TYPES,
  dateInputValue,
  formatDate,
  isOverdue,
  isWithinNextDays,
  relativeDays,
  reminderTypeMeta,
  speciesEmoji,
  speciesLabel,
  type Pet,
  type Reminder,
} from '@/lib/pet-utils'
import { cn } from '@/lib/utils'

export function PreventiveCare() {
  const { data: petsData, isLoading, error } = usePets()
  const pets = petsData?.pets ?? []
  const { details, isLoading: detailsLoading } = usePetDetails(
    pets.map((p) => p.id),
  )

  if (isLoading) return <PreventiveCareSkeleton />
  if (error) {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Couldn&apos;t load preventive care</AlertTitle>
        <AlertDescription>
          {(error as Error).message || 'Please refresh the page to try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  if (pets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <h3 className="text-base font-semibold">No pets yet</h3>
          <p className="max-w-prose text-sm text-muted-foreground">
            Add a pet to start scheduling preventive care — vaccines, parasite
            control, dental, weight and vet visits.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden">
        <div className="bg-radial-fade">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Preventive care
                </h1>
                <p className="text-sm text-muted-foreground">
                  Stay ahead of vaccines, parasites, dental, weight and vet
                  visits — for every pet.
                </p>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      <PreventiveCareScheduleCard />

      {pets.map((pet) => {
        const detail = details.find((d) => d.id === pet.id)
        return (
          <PetPreventiveSection
            key={pet.id}
            pet={pet}
            reminders={detail?.reminders ?? []}
            loading={detailsLoading}
          />
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
//  Explainer card
// ─────────────────────────────────────────────

const SCHEDULE_ITEMS = [
  {
    icon: <Syringe className="size-4" />,
    title: 'Vaccines',
    desc: 'Core + lifestyle boosters (rabies, distemper, bordetella, lepto, FVRCP, FeLV).',
  },
  {
    icon: <Pill className="size-4" />,
    title: 'Parasite control',
    desc: 'Flea, tick, heartworm and intestinal parasite prevention — monthly or quarterly.',
  },
  {
    icon: <Stethoscope className="size-4" />,
    title: 'Vet visits',
    desc: 'Annual wellness check; twice yearly for seniors (7+ years).',
  },
  {
    icon: <Scissors className="size-4" />,
    title: 'Dental & grooming',
    desc: 'Dental scale & polish every 6–12 months; grooming every 4–8 weeks.',
  },
  {
    icon: <Weight className="size-4" />,
    title: 'Weight monitoring',
    desc: 'Monthly weigh-ins. Sudden gain or loss can be an early warning sign.',
  },
]

function PreventiveCareScheduleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="size-4 text-primary" />
          What a preventive care schedule looks like
        </CardTitle>
        <CardDescription>
          The exact cadence depends on species, age, breed and lifestyle — your
          veterinarian is the source of truth. Ariquo helps you remember.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SCHEDULE_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">{item.title}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
//  Per-pet section
// ─────────────────────────────────────────────

function PetPreventiveSection({
  pet,
  reminders,
  loading,
}: {
  pet: Pet
  reminders: Reminder[]
  loading: boolean
}) {
  const [addOpen, setAddOpen] = useState(false)
  const sorted = useMemo(
    () =>
      [...reminders].sort(
        (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
      ),
    [reminders],
  )
  const openReminders = sorted.filter((r) => !r.done)
  const overdueCount = openReminders.filter((r) => isOverdue(r.dueAt)).length
  const soonCount = openReminders.filter(
    (r) => isWithinNextDays(r.dueAt, 14) && !isOverdue(r.dueAt),
  ).length

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 ring-1 ring-border">
            <AvatarImage src={pet.photoUrl ?? undefined} alt={pet.name} />
            <AvatarFallback>
              {pet.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {pet.name}
              <span className="text-base" aria-hidden>
                {speciesEmoji(pet.species)}
              </span>
            </CardTitle>
            <CardDescription>
              {speciesLabel(pet.species)}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {overdueCount > 0 ? (
            <Badge
              variant="outline"
              className="bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300"
            >
              <TriangleAlert className="size-3" />
              {overdueCount} overdue
            </Badge>
          ) : null}
          {soonCount > 0 ? (
            <Badge
              variant="outline"
              className="bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <CalendarClock className="size-3" />
              {soonCount} due soon
            </Badge>
          ) : null}
          {overdueCount === 0 && soonCount === 0 ? (
            <Badge
              variant="outline"
              className="bg-emerald-100 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <ShieldCheck className="size-3" />
              On track
            </Badge>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddOpen(true)}
            className="gap-1.5"
          >
            <ClipboardPlus className="size-4" />
            Add reminder
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No reminders scheduled. Add one to start your preventive plan.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((r) => (
              <PreventiveRow key={r.id} reminder={r} petId={pet.id} />
            ))}
          </ul>
        )}
      </CardContent>

      <AddReminderDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        petId={pet.id}
        petName={pet.name}
      />
    </Card>
  )
}

function PreventiveRow({
  reminder,
  petId,
}: {
  reminder: Reminder
  petId: string
}) {
  const mut = useToggleReminder(petId)
  const overdue = isOverdue(reminder.dueAt) && !reminder.done
  const soon =
    isWithinNextDays(reminder.dueAt, 14) && !overdue && !reminder.done
  const meta = reminderTypeMeta(reminder.type)

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
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'flex items-start gap-3 p-3 transition-colors hover:bg-muted/40',
        reminder.done && 'opacity-60',
        overdue && 'bg-red-50/50 dark:bg-red-950/10',
        soon && 'bg-amber-50/40 dark:bg-amber-950/10',
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
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'truncate text-sm font-medium',
              reminder.done && 'line-through',
            )}
          >
            {reminder.title}
          </span>
          <Badge variant="outline" className={cn('px-1.5 py-0', meta.className)}>
            {meta.label}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              'font-medium',
              overdue && 'text-red-700 dark:text-red-300',
              soon && 'text-amber-700 dark:text-amber-300',
            )}
          >
            {formatDate(reminder.dueAt, 'MMM d, yyyy')}
          </span>
          <span className="opacity-70">({relativeDays(reminder.dueAt)})</span>
        </div>
      </div>
      {overdue && (
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
      )}
    </motion.li>
  )
}

// ─────────────────────────────────────────────
//  Add reminder dialog (per-pet)
// ─────────────────────────────────────────────

function AddReminderDialog({
  open,
  onOpenChange,
  petId,
  petName,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  petId: string
  petName: string
}) {
  const mut = useAddReminder(petId)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<string>('VET_APPOINTMENT')
  const [dueAt, setDueAt] = useState(
    dateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
  )

  function reset() {
    setTitle('')
    setType('VET_APPOINTMENT')
    setDueAt(
      dateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }
    mut.mutate(
      {
        title: title.trim(),
        type,
        dueAt: new Date(dueAt).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success(`Reminder added for ${petName}`)
          reset()
          onOpenChange(false)
        },
        onError: (err: Error) =>
          toast.error(err.message || 'Failed to add reminder'),
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" />
            Add reminder for {petName}
          </DialogTitle>
          <DialogDescription>
            Schedule a vaccine, medication, vet visit, grooming or other task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rabies booster"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {reminderTypeMeta(t).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mut.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mut.isPending} className="min-w-32">
              {mut.isPending ? 'Adding…' : 'Add reminder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
//  Skeleton
// ─────────────────────────────────────────────

function PreventiveCareSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-xl" />
      ))}
    </div>
  )
}
