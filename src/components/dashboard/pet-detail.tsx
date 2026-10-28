'use client'

// Ariquo — Pet detail view.
// Header + tabbed view (Overview | Timeline | Vaccines | Medications |
// AI History | Reminders | Documents).

import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  Camera,
  CircleAlert,
  ClipboardList,
  FileText,
  Heart,
  Loader2,
  Microscope,
  Pencil,
  Pill,
  Plus,
  PawPrint,
  Sparkles,
  Stethoscope,
  Syringe,
  TriangleAlert,
  Weight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { AddPetDialog } from '@/components/dashboard/add-pet-dialog'
import { RISK_META, useApp } from '@/lib/store'
import {
  useAddEvent,
  useAddMedication,
  useAddReminder,
  useAddVaccine,
  useLogWeight,
  usePet,
  useToggleReminder,
} from '@/lib/pet-hooks'
import {
  AI_DISCLAIMER,
  DOCUMENT_TYPES,
  EVENT_TYPES,
  REMINDER_TYPES,
  SEVERITY_LEVELS,
  calcAge,
  confidenceLabel,
  dateInputValue,
  documentTypeMeta,
  eventTypeMeta,
  formatDate,
  formatDateTime,
  isOverdue,
  isWithinNextDays,
  moduleMeta,
  preview,
  relativeDays,
  reminderTypeMeta,
  severityMeta,
  sexLabel,
  speciesEmoji,
  speciesLabel,
  statusMeta,
  type AIAssessment,
  type MedicalEvent,
  type Medication,
  type Pet,
  type PetDetail,
  type PetDocument,
  type Reminder,
  type Vaccine,
} from '@/lib/pet-utils'
import { cn } from '@/lib/utils'

export function PetDetail() {
  const activePetId = useApp((s) => s.activePetId)
  const setSection = useApp((s) => s.setSection)
  const { data, isLoading, error, refetch } = usePet(activePetId)
  const [editOpen, setEditOpen] = useState(false)
  const [tab, setTab] = useState('overview')

  const pet = data?.pet

  if (isLoading) return <PetDetailSkeleton />
  if (error) {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Couldn&apos;t load this pet</AlertTitle>
        <AlertDescription>
          {(error as Error).message || 'Please try again.'}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }
  if (!pet) {
    return (
      <Alert>
        <PawPrint className="size-4" />
        <AlertTitle>No pet selected</AlertTitle>
        <AlertDescription>
          Pick a pet from your dashboard to open their record.
          <div className="mt-2">
            <Button size="sm" onClick={() => setSection('dashboard')}>
              Go to dashboard
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSection('pets')}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          All pets
        </Button>
      </div>

      <PetHeader
        pet={pet}
        onEdit={() => setEditOpen(true)}
      />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 sm:w-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <Activity className="size-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <ClipboardList className="size-4" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="vaccines" className="gap-1.5">
            <Syringe className="size-4" /> Vaccines
          </TabsTrigger>
          <TabsTrigger value="medications" className="gap-1.5">
            <Pill className="size-4" /> Medications
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5">
            <Sparkles className="size-4" /> AI history
          </TabsTrigger>
          <TabsTrigger value="reminders" className="gap-1.5">
            <CalendarClock className="size-4" /> Reminders
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="size-4" /> Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <OverviewTab pet={pet} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-0">
          <TimelineTab pet={pet} />
        </TabsContent>
        <TabsContent value="vaccines" className="mt-0">
          <VaccinesTab pet={pet} />
        </TabsContent>
        <TabsContent value="medications" className="mt-0">
          <MedicationsTab pet={pet} />
        </TabsContent>
        <TabsContent value="ai" className="mt-0">
          <AIHistoryTab pet={pet} />
        </TabsContent>
        <TabsContent value="reminders" className="mt-0">
          <RemindersTab pet={pet} />
        </TabsContent>
        <TabsContent value="documents" className="mt-0">
          <DocumentsTab pet={pet} />
        </TabsContent>
      </Tabs>

      <AddPetDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        pet={pet}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
//  Header
// ─────────────────────────────────────────────

function PetHeader({ pet, onEdit }: { pet: Pet; onEdit: () => void }) {
  const status = statusMeta(pet.status)

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/20 to-transparent" />
        <CardContent className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-6">
          <div className="size-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-background shadow-md sm:size-28">
            {pet.photoUrl ? (
              <img
                src={pet.photoUrl}
                alt={`${pet.name}, a ${speciesLabel(pet.species).toLowerCase()}`}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/40 text-3xl sm:text-5xl">
                {speciesEmoji(pet.species)}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display truncate text-3xl font-semibold tracking-tight sm:text-4xl">
                    {pet.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className={cn('px-2 py-0', status.className)}
                  >
                    <span className={cn('size-1.5 rounded-full', status.dot)} />
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {speciesLabel(pet.species)}
                  {pet.breed ? ` · ${pet.breed}` : ''}
                  {pet.sex ? ` · ${sexLabel(pet.sex)}` : ''}
                  {pet.color ? ` · ${pet.color}` : ''}
                </p>
              </div>
              <Button variant="outline" onClick={onEdit} className="gap-2">
                <Pencil className="size-4" />
                Edit profile
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <HeaderStat
                icon={<CalendarClock className="size-4" />}
                label="Age"
                value={calcAge(pet.birthDate)}
              />
              <HeaderStat
                icon={<Weight className="size-4" />}
                label="Weight"
                value={pet.weightKg != null ? `${pet.weightKg} kg` : '—'}
              />
              <HeaderStat
                icon={<Microscope className="size-4" />}
                label="Microchip"
                value={pet.microchipId ?? 'Not set'}
              />
              <HeaderStat
                icon={<Heart className="size-4" />}
                label="Neutered"
                value={pet.neutered ? 'Yes' : 'No'}
              />
            </div>

            {pet.allergies ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Allergies:
                </span>
                {pet.allergies
                  .split(',')
                  .map((a) => a.trim())
                  .filter(Boolean)
                  .map((a) => (
                    <Badge
                      key={a}
                      variant="outline"
                      className="bg-rose-50 px-1.5 py-0 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      {a}
                    </Badge>
                  ))}
              </div>
            ) : null}

            {pet.notes ? (
              <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                {pet.notes}
              </p>
            ) : null}
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

function HeaderStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background/70 p-2.5">
      <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Overview tab
// ─────────────────────────────────────────────

function OverviewTab({ pet }: { pet: PetDetail }) {
  const lastWeight = pet.weightLogs?.[pet.weightLogs.length - 1]
  const activeMeds = (pet.medications ?? []).filter((m) => m.active)
  const openReminders = (pet.reminders ?? []).filter((r) => !r.done)
  const latestAI = pet.assessments?.[0]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:col-span-3">
        <StatCard
          icon={<Weight className="size-4" />}
          label="Latest weight"
          value={lastWeight ? `${lastWeight.weightKg} kg` : pet.weightKg != null ? `${pet.weightKg} kg` : '—'}
          sub={lastWeight ? formatDate(lastWeight.loggedAt) : 'No logs yet'}
        />
        <StatCard
          icon={<Syringe className="size-4" />}
          label="Vaccines"
          value={String(pet.vaccines?.length ?? 0)}
          sub="On record"
        />
        <StatCard
          icon={<Pill className="size-4" />}
          label="Active meds"
          value={String(activeMeds.length)}
          sub={`${pet.medications?.length ?? 0} total`}
        />
        <StatCard
          icon={<CalendarClock className="size-4" />}
          label="Open reminders"
          value={String(openReminders.length)}
          sub={`${pet.reminders?.length ?? 0} total`}
        />
      </section>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Weight className="size-4 text-primary" />
            Weight trend
          </CardTitle>
          <CardDescription>
            Track changes over time. A sudden drop or gain can be an early sign.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeightChart
            weightLogs={pet.weightLogs ?? []}
            species={pet.species}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Latest AI assessment
          </CardTitle>
          <CardDescription>
            {latestAI ? formatDateTime(latestAI.createdAt) : 'No AI runs yet'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {latestAI ? (
            <LatestAISummary assessment={latestAI} />
          ) : (
            <EmptyMini
              icon={<Sparkles className="size-5" />}
              title="No AI history yet"
              hint="Run a symptom triage or vision analysis to see observations here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="truncate text-xl font-semibold tabular-nums">
            {value}
          </div>
          {sub ? (
            <div className="truncate text-xs text-muted-foreground">{sub}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

const weightChartConfig: ChartConfig = {
  weightKg: {
    label: 'Weight (kg)',
    color: 'var(--chart-1)',
  },
}

function WeightChart({
  weightLogs,
  species,
}: {
  weightLogs: { weightKg: number; loggedAt: string }[]
  species: string
}) {
  const data = useMemo(
    () =>
      weightLogs.map((w) => ({
        date: formatDate(w.loggedAt, 'MMM d, yy'),
        weightKg: w.weightKg,
      })),
    [weightLogs],
  )

  if (data.length === 0) {
    return (
      <EmptyMini
        icon={<Weight className="size-5" />}
        title="No weight logs yet"
        hint={
          species === 'CAT'
            ? 'Log weight monthly to track healthy growth.'
            : 'Add a weight entry from the profile editor.'
        }
      />
    )
  }

  return (
    <ChartContainer
      config={weightChartConfig}
      className="aspect-[16/7] w-full"
    >
      <LineChart data={data} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          domain={['auto', 'auto']}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="weightKg"
          stroke="var(--color-weightKg)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  )
}

function LatestAISummary({ assessment }: { assessment: AIAssessment }) {
  const meta = moduleMeta(assessment.module)
  const risk = RISK_META[assessment.riskLevel] ?? RISK_META.UNKNOWN

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={meta.className}>
          {meta.label}
        </Badge>
        <Badge
          variant="outline"
          className={cn('ring-1', risk.color, risk.bg, risk.ring)}
        >
          {risk.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Confidence: {confidenceLabel(assessment.confidence)}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {preview(assessment.observations, 200) || 'No observations recorded.'}
      </p>
      <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
        <strong className="font-medium text-foreground">Note:</strong>{' '}
        {AI_DISCLAIMER}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Timeline tab
// ─────────────────────────────────────────────

function TimelineTab({ pet }: { pet: PetDetail }) {
  const [open, setOpen] = useState(false)
  const events = pet.events ?? []

  if (events.length === 0) {
    return (
      <div className="grid gap-4">
        <EmptyCard
          icon={<ClipboardList className="size-6" />}
          title="No timeline events yet"
          hint="Vaccinations, visits, lab work, symptoms — add them here to build a lifelong health record."
          action={
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="size-4" /> Add event
            </Button>
          }
        />
        <AddEventDialog
          open={open}
          onOpenChange={setOpen}
          petId={pet.id}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {events.length} event{events.length === 1 ? '' : 's'} on record.
        </p>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" /> Add event
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <ol className="relative ml-2 space-y-4 border-l border-border pl-6">
            {events.map((ev) => (
              <TimelineRow key={ev.id} event={ev} />
            ))}
          </ol>
        </CardContent>
      </Card>

      <AddEventDialog open={open} onOpenChange={setOpen} petId={pet.id} />
    </div>
  )
}

function TimelineRow({ event }: { event: MedicalEvent }) {
  const meta = eventTypeMeta(event.type)
  const sev = severityMeta(event.severity)
  return (
    <li className="relative">
      <span
        className={cn(
          'absolute -left-[1.65rem] top-1 size-2.5 rounded-full ring-4 ring-card',
          sev.stripe,
        )}
        aria-hidden
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{event.title}</h3>
          <Badge variant="outline" className={cn('px-1.5 py-0', meta.className)}>
            {meta.label}
          </Badge>
          <Badge variant="outline" className={cn('px-1.5 py-0', sev.className)}>
            {sev.label}
          </Badge>
        </div>
        <time className="text-xs text-muted-foreground">
          {formatDate(event.date)}
        </time>
      </div>
      {event.notes ? (
        <p className="mt-1 text-sm text-muted-foreground">{event.notes}</p>
      ) : null}
    </li>
  )
}

function AddEventDialog({
  open,
  onOpenChange,
  petId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  petId: string
}) {
  const mut = useAddEvent(petId)
  const [type, setType] = useState<string>('VISIT')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(dateInputValue(new Date().toISOString()))
  const [severity, setSeverity] = useState<string>('ROUTINE')
  const [notes, setNotes] = useState('')

  function reset() {
    setType('VISIT')
    setTitle('')
    setDate(dateInputValue(new Date().toISOString()))
    setSeverity('ROUTINE')
    setNotes('')
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }
    mut.mutate(
      {
        type,
        title: title.trim(),
        date: new Date(date).toISOString(),
        severity,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Event added to timeline')
          reset()
          onOpenChange(false)
        },
        onError: (err: Error) =>
          toast.error(err.message || 'Failed to add event'),
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
            <ClipboardList className="size-5 text-primary" />
            Add timeline event
          </DialogTitle>
          <DialogDescription>
            Add a vaccination, visit, lab, imaging, symptom, procedure or note.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Type">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {eventTypeMeta(t).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Date">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual wellness exam"
              required
            />
          </FormField>
          <FormField label="Severity">
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_LEVELS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {severityMeta(s).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Notes">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Findings, results, recommendations…"
              rows={3}
            />
          </FormField>
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
              {mut.isPending && <Loader2 className="size-4 animate-spin" />}
              Add event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
//  Vaccines tab
// ─────────────────────────────────────────────

function VaccinesTab({ pet }: { pet: PetDetail }) {
  const [open, setOpen] = useState(false)
  const vaccines = pet.vaccines ?? []

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {vaccines.length} vaccine record{vaccines.length === 1 ? '' : 's'}.
        </p>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" /> Add vaccine
        </Button>
      </div>

      {vaccines.length === 0 ? (
        <EmptyCard
          icon={<Syringe className="size-6" />}
          title="No vaccines recorded yet"
          hint="Track boosters and due dates so you never miss one."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vaccine</TableHead>
                  <TableHead>Given</TableHead>
                  <TableHead>Next due</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vaccines.map((v) => (
                  <VaccineRow key={v.id} vaccine={v} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AddVaccineDialog open={open} onOpenChange={setOpen} petId={pet.id} />
    </div>
  )
}

function VaccineRow({ vaccine }: { vaccine: Vaccine }) {
  const overdue = isOverdue(vaccine.nextDue)
  const soon = isWithinNextDays(vaccine.nextDue, 30) && !overdue
  return (
    <TableRow>
      <TableCell className="font-medium">{vaccine.name}</TableCell>
      <TableCell>{formatDate(vaccine.date)}</TableCell>
      <TableCell>
        {vaccine.nextDue ? (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
              overdue &&
                'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
              soon &&
                !overdue &&
                'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
              !overdue &&
                !soon &&
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            )}
          >
            {overdue && <TriangleAlert className="size-3" />}
            {formatDate(vaccine.nextDue)}
            <span className="opacity-70">({relativeDays(vaccine.nextDue)})</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="max-w-xs text-muted-foreground">
        {vaccine.notes ?? '—'}
      </TableCell>
    </TableRow>
  )
}

function AddVaccineDialog({
  open,
  onOpenChange,
  petId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  petId: string
}) {
  const mut = useAddVaccine(petId)
  const [name, setName] = useState('')
  const [date, setDate] = useState(dateInputValue(new Date().toISOString()))
  const [nextDue, setNextDue] = useState('')
  const [notes, setNotes] = useState('')

  function reset() {
    setName('')
    setDate(dateInputValue(new Date().toISOString()))
    setNextDue('')
    setNotes('')
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter the vaccine name')
      return
    }
    mut.mutate(
      {
        name: name.trim(),
        date: new Date(date).toISOString(),
        nextDue: nextDue ? new Date(nextDue).toISOString() : undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Vaccine added')
          reset()
          onOpenChange(false)
        },
        onError: (err: Error) =>
          toast.error(err.message || 'Failed to add vaccine'),
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
            <Syringe className="size-5 text-primary" />
            Add vaccine
          </DialogTitle>
          <DialogDescription>
            Record a vaccine and set the next due date for reminders.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <FormField label="Vaccine name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rabies"
              required
            />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Date given">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </FormField>
            <FormField label="Next due (optional)">
              <Input
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Batch number, vet, reactions…"
              rows={2}
            />
          </FormField>
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
              {mut.isPending && <Loader2 className="size-4 animate-spin" />}
              Add vaccine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
//  Medications tab
// ─────────────────────────────────────────────

function MedicationsTab({ pet }: { pet: PetDetail }) {
  const [open, setOpen] = useState(false)
  const meds = pet.medications ?? []

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meds.length} medication{meds.length === 1 ? '' : 's'} on record.
        </p>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" /> Add medication
        </Button>
      </div>

      {meds.length === 0 ? (
        <EmptyCard
          icon={<Pill className="size-6" />}
          title="No medications recorded yet"
          hint="Add prescriptions, preventatives and supplements."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {meds.map((m) => (
            <MedicationCard key={m.id} medication={m} />
          ))}
        </div>
      )}

      <AddMedicationDialog open={open} onOpenChange={setOpen} petId={pet.id} />
    </div>
  )
}

function MedicationCard({ medication }: { medication: Medication }) {
  return (
    <Card className={cn(!medication.active && 'opacity-70')}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
              <Pill className="size-4" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">
                {medication.name}
              </div>
              {medication.dose ? (
                <div className="text-xs text-muted-foreground">
                  {medication.dose}
                </div>
              ) : null}
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              medication.active
                ? 'bg-emerald-100 px-1.5 py-0 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-muted px-1.5 py-0 text-xs text-muted-foreground'
            }
          >
            {medication.active ? 'Active' : 'Stopped'}
          </Badge>
        </div>
        {medication.frequency ? (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Frequency:</span>{' '}
            {medication.frequency}
          </div>
        ) : null}
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Started:</span>{' '}
          {formatDate(medication.startDate)}
          {medication.endDate ? (
            <>
              {' · '}
              <span className="font-medium text-foreground">Ended:</span>{' '}
              {formatDate(medication.endDate)}
            </>
          ) : null}
        </div>
        {medication.notes ? (
          <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
            {medication.notes}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function AddMedicationDialog({
  open,
  onOpenChange,
  petId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  petId: string
}) {
  const mut = useAddMedication(petId)
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState('')
  const [startDate, setStartDate] = useState(
    dateInputValue(new Date().toISOString()),
  )
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [active, setActive] = useState(true)

  function reset() {
    setName('')
    setDose('')
    setFrequency('')
    setStartDate(dateInputValue(new Date().toISOString()))
    setEndDate('')
    setNotes('')
    setActive(true)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter the medication name')
      return
    }
    mut.mutate(
      {
        name: name.trim(),
        dose: dose.trim() || undefined,
        frequency: frequency.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
        active,
      },
      {
        onSuccess: () => {
          toast.success('Medication added')
          reset()
          onOpenChange(false)
        },
        onError: (err: Error) =>
          toast.error(err.message || 'Failed to add medication'),
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
            <Pill className="size-5 text-primary" />
            Add medication
          </DialogTitle>
          <DialogDescription>
            Prescriptions, preventatives, supplements and over-the-counter.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <FormField label="Medication name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bravecto (tick/flea)"
              required
            />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Dose">
              <Input
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g. 1 chew"
              />
            </FormField>
            <FormField label="Frequency">
              <Input
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g. Every 12 weeks"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Start date">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormField>
            <FormField label="End date (optional)">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason, prescribing vet, reactions…"
              rows={2}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={active}
              onCheckedChange={(v) => setActive(v === true)}
            />
            Currently active
          </label>
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
              {mut.isPending && <Loader2 className="size-4 animate-spin" />}
              Add medication
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
//  AI history tab
// ─────────────────────────────────────────────

function AIHistoryTab({ pet }: { pet: PetDetail }) {
  const assessments = pet.assessments ?? []
  const [selected, setSelected] = useState<AIAssessment | null>(null)

  if (assessments.length === 0) {
    return (
      <EmptyCard
        icon={<Sparkles className="size-6" />}
        title="No AI assessments yet"
        hint="Run a symptom triage, vision analysis, nutrition or behavior check to start building AI history."
      />
    )
  }

  return (
    <div className="grid gap-4">
      <Alert>
        <Sparkles className="size-4" />
        <AlertTitle>How to read these results</AlertTitle>
        <AlertDescription>{AI_DISCLAIMER}</AlertDescription>
      </Alert>

      <div className="grid gap-3">
        {assessments.map((a) => (
          <AIHistoryRow
            key={a.id}
            assessment={a}
            onOpen={() => setSelected(a)}
          />
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto scroll-area-thin sm:max-w-md"
        >
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" />
                  AI assessment detail
                </SheetTitle>
                <SheetDescription>
                  {formatDateTime(selected.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <AIDetail assessment={selected} />
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function AIHistoryRow({
  assessment,
  onOpen,
}: {
  assessment: AIAssessment
  onOpen: () => void
}) {
  const meta = moduleMeta(assessment.module)
  const risk = RISK_META[assessment.riskLevel] ?? RISK_META.UNKNOWN
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer transition-colors hover:border-primary/40"
        onClick={onOpen}
      >
        <CardContent className="space-y-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={meta.className}>
                {meta.label}
              </Badge>
              <Badge
                variant="outline"
                className={cn('ring-1', risk.color, risk.bg, risk.ring)}
              >
                {risk.label}
              </Badge>
            </div>
            <time className="text-xs text-muted-foreground">
              {formatDate(assessment.createdAt)}
            </time>
          </div>
          {assessment.inputText ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Input:</span>{' '}
              {preview(assessment.inputText, 140)}
            </p>
          ) : null}
          {assessment.observations ? (
            <p className="text-sm">{preview(assessment.observations, 180)}</p>
          ) : null}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Confidence: {confidenceLabel(assessment.confidence)}</span>
            <span className="font-medium text-primary">View detail →</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AIDetail({ assessment }: { assessment: AIAssessment }) {
  const meta = moduleMeta(assessment.module)
  const risk = RISK_META[assessment.riskLevel] ?? RISK_META.UNKNOWN

  return (
    <div className="grid gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={meta.className}>
          {meta.label}
        </Badge>
        <Badge
          variant="outline"
          className={cn('ring-1', risk.color, risk.bg, risk.ring)}
        >
          {risk.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Confidence: {confidenceLabel(assessment.confidence)}
        </span>
      </div>

      {assessment.inputText ? (
        <DetailBlock label="Input">
          <p className="text-sm">{assessment.inputText}</p>
        </DetailBlock>
      ) : null}

      {assessment.observations ? (
        <DetailBlock label="Observations">
          <p className="whitespace-pre-line text-sm">
            {assessment.observations}
          </p>
        </DetailBlock>
      ) : null}

      {assessment.recommendations ? (
        <DetailBlock label="Recommendations">
          <p className="whitespace-pre-line text-sm">
            {assessment.recommendations}
          </p>
        </DetailBlock>
      ) : null}

      {assessment.escalation ? (
        <DetailBlock label="Escalation">
          <p className="text-sm">{assessment.escalation}</p>
        </DetailBlock>
      ) : null}

      <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
        <strong className="font-medium text-foreground">Note:</strong>{' '}
        {AI_DISCLAIMER}
      </p>
    </div>
  )
}

function DetailBlock({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="rounded-lg border border-border bg-card p-3">{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Reminders tab
// ─────────────────────────────────────────────

function RemindersTab({ pet }: { pet: PetDetail }) {
  const [open, setOpen] = useState(false)
  const reminders = pet.reminders ?? []

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {reminders.length} reminder{reminders.length === 1 ? '' : 's'}.
        </p>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" /> Add reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <EmptyCard
          icon={<CalendarClock className="size-6" />}
          title="No reminders yet"
          hint="Vaccines, medications, vet visits, grooming — schedule them so you never miss one."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {reminders.map((r) => (
                <ReminderRow key={r.id} reminder={r} petId={pet.id} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <AddReminderDialog open={open} onOpenChange={setOpen} petId={pet.id} />
    </div>
  )
}

function ReminderRow({ reminder, petId }: { reminder: Reminder; petId: string }) {
  const mut = useToggleReminder(petId)
  const overdue = isOverdue(reminder.dueAt) && !reminder.done
  const soon = isWithinNextDays(reminder.dueAt, 14) && !overdue && !reminder.done
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
    <li
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
        <div className="flex items-center gap-2">
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
    </li>
  )
}

function AddReminderDialog({
  open,
  onOpenChange,
  petId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  petId: string
}) {
  const mut = useAddReminder(petId)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<string>('VET_APPOINTMENT')
  const [dueAt, setDueAt] = useState(
    dateInputValue(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ),
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
          toast.success('Reminder added')
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
            Add reminder
          </DialogTitle>
          <DialogDescription>
            Schedule a vaccine, medication, vet visit, grooming or other task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <FormField label="Title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rabies booster"
              required
            />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Type">
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
            </FormField>
            <FormField label="Due date">
              <Input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </FormField>
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
              {mut.isPending && <Loader2 className="size-4 animate-spin" />}
              Add reminder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
//  Documents tab
// ─────────────────────────────────────────────

function DocumentsTab({ pet }: { pet: PetDetail }) {
  const [open, setOpen] = useState(false)
  const docs = pet.documents ?? []

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {docs.length} document{docs.length === 1 ? '' : 's'}.
        </p>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" /> Add document
        </Button>
      </div>

      {docs.length === 0 ? (
        <EmptyCard
          icon={<FileText className="size-6" />}
          title="No documents yet"
          hint="Lab reports, imaging, prescriptions — keep them all in one place."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {docs.map((d) => {
                const meta = documentTypeMeta(d.type)
                return (
                  <li
                    key={d.id}
                    className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {d.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('px-1.5 py-0', meta.className)}
                        >
                          {meta.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Uploaded {formatDate(d.uploadedAt)}
                      </div>
                    </div>
                    {d.fileUrl ? (
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Open
                      </a>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <DocumentUploadDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

function DocumentUploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<string>('LAB_REPORT')

  function reset() {
    setName('')
    setType('LAB_REPORT')
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    toast.info('Document upload is coming soon. No file was stored.')
    reset()
    onOpenChange(false)
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
            <FileText className="size-5 text-primary" />
            Add document
          </DialogTitle>
          <DialogDescription>
            Document storage with versioning and AI-powered extraction is on
            the roadmap. For now, no files are stored.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <FormField label="Document name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annual blood panel 2024"
            />
          </FormField>
          <FormField label="Type">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {documentTypeMeta(t).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            File upload coming soon
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Notify me</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
//  Shared small components
// ─────────────────────────────────────────────

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function EmptyCard({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode
  title: string
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
        {hint ? (
          <p className="max-w-prose text-sm text-muted-foreground">{hint}</p>
        ) : null}
        {action ?? null}
      </CardContent>
    </Card>
  )
}

function EmptyMini({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode
  title: string
  hint?: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
      <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="text-sm font-medium">{title}</div>
      {hint ? (
        <p className="max-w-prose text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function PetDetailSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-10 w-full max-w-2xl rounded-lg" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}
