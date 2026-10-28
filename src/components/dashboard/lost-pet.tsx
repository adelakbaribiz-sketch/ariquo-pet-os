'use client'

// Ariquo — Lost pet view.
// List of pets with "Mark as lost / found" toggle.
// When status is LOST, show an alert with the 4-step recovery playbook.

import { useState } from 'react'
import {
  BellRing,
  CircleAlert,
  MapPin,
  PawPrint,
  PhoneCall,
  QrCode,
  Share2,
  ShieldAlert,
  ShieldCheck,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  usePets,
  useUpdatePet,
} from '@/lib/pet-hooks'
import {
  calcAge,
  speciesEmoji,
  speciesLabel,
  statusMeta,
  type Pet,
} from '@/lib/pet-utils'
import { cn } from '@/lib/utils'

export function LostPet() {
  const { data, isLoading, error } = usePets()
  const pets = data?.pets ?? []

  if (isLoading) return <LostPetSkeleton />
  if (error) {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Couldn&apos;t load your pets</AlertTitle>
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
            <PawPrint className="size-6" />
          </div>
          <h3 className="text-base font-semibold">No pets yet</h3>
          <p className="max-w-prose text-sm text-muted-foreground">
            Add a pet to enable the lost-pet playbook — digital ID QR, network
            notification, microchip registry and shelter outreach.
          </p>
        </CardContent>
      </Card>
    )
  }

  const lostCount = pets.filter((p) => p.status === 'LOST').length

  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden">
        <div className="bg-radial-fade">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                <ShieldAlert className="size-6" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Lost &amp; found
                </h1>
                <p className="text-sm text-muted-foreground">
                  If a pet goes missing, every minute matters. Activate the
                  recovery playbook from here.
                </p>
              </div>
            </div>
            {lostCount > 0 ? (
              <Badge
                variant="outline"
                className="bg-rose-100 px-3 py-1 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <ShieldAlert className="size-3.5" />
                {lostCount} pet{lostCount === 1 ? '' : 's'} reported lost
              </Badge>
            ) : null}
          </CardContent>
        </div>
      </Card>

      <Alert>
        <ShieldCheck className="size-4" />
        <AlertTitle>Prevention first</AlertTitle>
        <AlertDescription>
          Keep microchip details current, attach a digital ID QR to your
          pet&apos;s collar, and have a recent photo ready. The faster you can
          share accurate info, the higher the chance of a safe return.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pets.map((pet) => (
          <LostPetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Lost pet card
// ─────────────────────────────────────────────

function LostPetCard({ pet }: { pet: Pet }) {
  const [confirm, setConfirm] = useState<null | 'LOST' | 'ACTIVE'>(null)
  const updateMut = useUpdatePet(pet.id)
  const status = statusMeta(pet.status)
  const isLost = pet.status === 'LOST'

  function runUpdate() {
    const nextStatus = confirm ?? 'ACTIVE'
    updateMut.mutate(
      { status: nextStatus },
      {
        onSuccess: () => {
          toast.success(
            nextStatus === 'LOST'
              ? `${pet.name} marked as lost. Follow the recovery playbook below.`
              : `${pet.name} marked as found. Wonderful news!`,
          )
          setConfirm(null)
        },
        onError: (err: Error) =>
          toast.error(err.message || 'Failed to update status'),
      },
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'h-full overflow-hidden p-0 transition-colors',
          isLost && 'border-rose-300 dark:border-rose-900',
        )}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {pet.photoUrl ? (
            <img
              src={pet.photoUrl}
              alt={`${pet.name}, a ${speciesLabel(pet.species).toLowerCase()}`}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/30 text-4xl">
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

        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold leading-tight">
                {pet.name}
              </h3>
              <p className="truncate text-xs text-muted-foreground">
                {speciesLabel(pet.species)}
                {pet.breed ? ` · ${pet.breed}` : ''}
                {pet.color ? ` · ${pet.color}` : ''}
              </p>
            </div>
            <Avatar className="size-9 ring-1 ring-border">
              <AvatarImage src={pet.photoUrl ?? undefined} alt={pet.name} />
              <AvatarFallback className="text-xs">
                {pet.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-muted/60 px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Age
              </div>
              <div className="truncate text-sm font-medium">
                {calcAge(pet.birthDate)}
              </div>
            </div>
            <div className="rounded-lg bg-muted/60 px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Microchip
              </div>
              <div className="truncate text-sm font-medium tabular-nums">
                {pet.microchipId ?? 'Not set'}
              </div>
            </div>
          </div>

          {isLost ? (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setConfirm('ACTIVE')}
              disabled={updateMut.isPending}
            >
              <ShieldCheck className="size-4" />
              Mark as found
            </Button>
          ) : (
            <Button
              variant="outline"
              className="gap-2 border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
              onClick={() => setConfirm('LOST')}
              disabled={updateMut.isPending}
            >
              <ShieldAlert className="size-4" />
              Mark as lost
            </Button>
          )}

          {isLost ? <LostPlaybook pet={pet} /> : null}
        </CardContent>
      </Card>

      <StatusConfirmDialog
        open={!!confirm}
        petName={pet.name}
        nextStatus={confirm}
        pending={updateMut.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={runUpdate}
      />
    </motion.div>
  )
}

// ─────────────────────────────────────────────
//  Recovery playbook (shown when LOST)
// ─────────────────────────────────────────────

const PLAYBOOK_STEPS = [
  {
    icon: <QrCode className="size-4" />,
    title: 'Activate digital ID QR',
    desc: 'Turn on the public pet profile QR so anyone who scans the collar tag can view your contact info and the lost report.',
  },
  {
    icon: <BellRing className="size-4" />,
    title: 'Notify the Ariquo network',
    desc: 'Alert nearby Ariquo members, vets, groomers and shelters within a configurable radius.',
  },
  {
    icon: <PhoneCall className="size-4" />,
    title: 'Contact the microchip registry',
    desc: `Log into your microchip registry and flag the pet as missing so any scan triggers an immediate call.`,
  },
  {
    icon: <MapPin className="size-4" />,
    title: 'Contact local shelters',
    desc: 'Call or visit local animal shelters, rescues and animal control — provide a recent photo and microchip number.',
  },
] as const

// Shares a plain-text lost-pet notice via the OS share sheet, or copies it.
// (A broadcast to a provider network is not implemented in the prototype.)
async function shareLostAlert(pet: Pet) {
  const text = [
    `LOST ${speciesLabel(pet.species).toUpperCase()}: ${pet.name}`,
    [pet.breed, pet.color].filter(Boolean).join(', '),
    pet.microchipId ? `Microchip: ${pet.microchipId}` : null,
    'If seen, please contact the owner or your local vet.',
  ]
    .filter(Boolean)
    .join('\n')
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: `Lost: ${pet.name}`, text })
      return
    }
    await navigator.clipboard.writeText(text)
    toast.success('Lost-pet notice copied — paste it into chats or social posts.')
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return
    toast.error('Could not share or copy the notice on this device.')
  }
}

function LostPlaybook({ pet }: { pet: Pet }) {
  return (
    <div className="mt-1 space-y-3">
      <Alert className="border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20">
        <ShieldAlert className="size-4 text-rose-700 dark:text-rose-300" />
        <AlertTitle className="text-rose-800 dark:text-rose-200">
          {pet.name} is missing — recovery playbook
        </AlertTitle>
        <AlertDescription className="text-rose-700 dark:text-rose-300">
          Follow these four steps in order. The first 24 hours matter most.
        </AlertDescription>
      </Alert>

      <ol className="space-y-2">
        {PLAYBOOK_STEPS.map((step, idx) => (
          <li
            key={step.title}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {idx + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span className="text-rose-700 dark:text-rose-300">
                  {step.icon}
                </span>
                {step.title}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {step.desc}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => shareLostAlert(pet)}
        >
          <Share2 className="size-4" />
          Share notice
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Status confirmation
// ─────────────────────────────────────────────

function StatusConfirmDialog({
  open,
  petName,
  nextStatus,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean
  petName: string
  nextStatus: null | 'LOST' | 'ACTIVE'
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const isLost = nextStatus === 'LOST'
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isLost
              ? `Mark ${petName} as lost?`
              : `Mark ${petName} as found?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLost
              ? 'This activates the lost-pet recovery playbook and shows a missing banner. You can mark them as found at any time.'
              : 'This will set their status back to Active and clear the missing banner.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              isLost &&
                'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600',
            )}
          >
            {pending ? 'Updating…' : isLost ? 'Mark as lost' : 'Mark as found'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─────────────────────────────────────────────
//  Skeleton
// ─────────────────────────────────────────────

function LostPetSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
