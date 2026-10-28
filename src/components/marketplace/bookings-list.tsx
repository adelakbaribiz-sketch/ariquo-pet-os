'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO, isPast, isFuture } from 'date-fns'
import { toast } from 'sonner'
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  PawPrint,
  Stethoscope,
  XCircle,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  MarketplaceProvider,
  MarketplaceService,
} from './booking-dialog'

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'

export interface Booking {
  id: string
  scheduledAt: string
  status: BookingStatus
  notes?: string | null
  price?: number | null
  provider: MarketplaceProvider
  service?: MarketplaceService | null
  pet?: {
    id: string
    name: string
    species: string
    breed?: string | null
    photoUrl?: string | null
  } | null
}

const STATUS_META: Record<
  BookingStatus,
  { label: string; className: string; dot: string }
> = {
  PENDING: {
    label: 'Pending',
    className:
      'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Confirmed',
    className:
      'bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary-foreground',
    dot: 'bg-primary',
  },
  COMPLETED: {
    label: 'Completed',
    className:
      'bg-muted text-muted-foreground dark:bg-muted/40 dark:text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  CANCELLED: {
    label: 'Cancelled',
    className:
      'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 line-through',
    dot: 'bg-red-500',
  },
}

function providerInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

function providerTypeLabel(type: string): string {
  switch (type) {
    case 'VETERINARIAN':
      return 'Veterinarian'
    case 'GROOMING':
      return 'Groomer'
    case 'BOARDING':
      return 'Boarding'
    case 'WALKER':
      return 'Dog walker'
    case 'TRAINER':
      return 'Trainer'
    case 'SITTER':
      return 'Pet sitter'
    case 'TRANSPORT':
      return 'Transport'
    case 'PHARMACY':
      return 'Pharmacy'
    case 'PET_SHOP':
      return 'Pet shop'
    default:
      return type
  }
}

function parseDate(value: string): Date {
  // API may return ISO strings; some SQLite drivers serialize without tz suffix.
  // Try ISO first; fallback to parseISO which handles naive YYYY-MM-DDTHH:mm:ss.
  const d = new Date(value)
  if (!isNaN(d.getTime())) return d
  return parseISO(value)
}

function BookingRow({ booking }: { booking: Booking }) {
  const queryClient = useQueryClient()
  const scheduled = parseDate(booking.scheduledAt)
  const meta = STATUS_META[booking.status]
  const isActive = booking.status === 'PENDING' || booking.status === 'CONFIRMED'

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bookings?id=${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (!res.ok) throw new Error('Failed to cancel booking')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Booking cancelled', {
        description: `${booking.provider.name} has been notified.`,
      })
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: () => {
      toast.error('Could not cancel booking. Please try again.')
    },
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bookings?id=${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      if (!res.ok) throw new Error('Failed to mark booking complete')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Marked as completed', {
        description: 'Thanks for letting us know!',
      })
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: () => {
      toast.error('Could not update booking. Please try again.')
    },
  })

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Avatar className="size-11 ring-2 ring-primary/10 shrink-0">
          {booking.provider.avatarUrl ? (
            <AvatarImage
              src={booking.provider.avatarUrl}
              alt={booking.provider.name}
            />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {providerInitials(booking.provider.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold leading-tight truncate">
                {booking.provider.name}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Stethoscope className="size-3 shrink-0" />
                <span className="truncate">
                  {providerTypeLabel(booking.provider.type)}
                  {booking.provider.clinic
                    ? ` · ${booking.provider.clinic}`
                    : ''}
                </span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'gap-1 border-transparent px-2 py-0.5 text-xs shrink-0',
                meta.className,
              )}
            >
              <span
                className={cn('size-1.5 rounded-full', meta.dot)}
                aria-hidden
              />
              {meta.label}
            </Badge>
          </div>
        </div>
      </div>

      {booking.service ? (
        <div className="rounded-md bg-secondary/60 px-3 py-2">
          <p className="text-sm font-medium leading-tight">
            {booking.service.name}
          </p>
          {booking.service.description ? (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {booking.service.description}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="size-3.5 text-primary" />
          <time dateTime={booking.scheduledAt}>
            {format(scheduled, 'EEE, d MMM yyyy · HH:mm')}
          </time>
        </span>
        {booking.pet ? (
          <span className="inline-flex items-center gap-1.5">
            <PawPrint className="size-3.5 text-primary" />
            <span className="truncate">
              {booking.pet.name}
              {booking.pet.breed ? ` · ${booking.pet.breed}` : ''}
            </span>
          </span>
        ) : null}
        {booking.price != null ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="font-medium text-foreground">€{booking.price.toFixed(0)}</span>
          </span>
        ) : null}
      </div>

      {booking.notes ? (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 italic line-clamp-2">
          “{booking.notes}”
        </p>
      ) : null}

      {isActive ? (
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-destructive hover:text-destructive hover:bg-destructive/5"
            disabled={cancelMutation.isPending || completeMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            {cancelMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-9"
            disabled={cancelMutation.isPending || completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
          >
            {completeMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Mark completed
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function BookingsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border bg-card p-4"
        >
          <Skeleton className="size-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
        <CalendarClock className="size-6 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
    </div>
  )
}

export function BookingsList() {
  const { data, isLoading, isError } = useQuery<{ bookings: Booking[] }>({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings')
      if (!res.ok) throw new Error('Failed to load bookings')
      return res.json()
    },
    staleTime: 30_000,
  })

  const bookings = data?.bookings ?? []

  const { upcoming, past } = React.useMemo(() => {
    const upcoming: Booking[] = []
    const past: Booking[] = []
    for (const b of bookings) {
      const isActive = b.status === 'PENDING' || b.status === 'CONFIRMED'
      if (isActive && isFuture(parseDate(b.scheduledAt))) {
        upcoming.push(b)
      } else if (isActive) {
        // Active booking whose time has already passed — keep in upcoming so
        // the owner can still cancel / mark complete.
        upcoming.push(b)
      } else {
        past.push(b)
      }
    }
    upcoming.sort(
      (a, b) =>
        parseDate(a.scheduledAt).getTime() -
        parseDate(b.scheduledAt).getTime(),
    )
    past.sort(
      (a, b) =>
        parseDate(b.scheduledAt).getTime() -
        parseDate(a.scheduledAt).getTime(),
    )
    return { upcoming, past }
  }, [bookings])

  if (isLoading) {
    return (
      <section className="rounded-2xl border bg-card/50 p-4 sm:p-5">
        <header className="flex items-center gap-2 mb-3">
          <CalendarClock className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Your bookings</h2>
        </header>
        <BookingsSkeleton />
      </section>
    )
  }

  if (isError) {
    return (
      <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 sm:p-5">
        <p className="text-sm text-destructive">
          Could not load your bookings. Please try again later.
        </p>
      </section>
    )
  }

  if (bookings.length === 0) {
    return null // No bookings → silently hide; provider grid is the hero.
  }

  return (
    <section
      aria-label="Your bookings"
      className="rounded-2xl border bg-card/50 p-4 sm:p-5"
    >
      <header className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Your bookings</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {upcoming.length} upcoming · {past.length} past
        </span>
      </header>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-3">
          <TabsTrigger value="upcoming" className="gap-1.5">
            Upcoming
            {upcoming.length > 0 ? (
              <span className="ml-1 rounded-full bg-primary/15 text-primary text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                {upcoming.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-1.5">
            Past
            {past.length > 0 ? (
              <span className="ml-1 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                {past.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-0">
          {upcoming.length === 0 ? (
            <EmptyState message="No upcoming bookings yet. Find a trusted provider below to get started." />
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-0">
          {past.length === 0 ? (
            <EmptyState message="No past appointments yet. Once you complete a booking it will show up here." />
          ) : (
            <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto scroll-area-thin pr-1">
              {past.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  )
}
