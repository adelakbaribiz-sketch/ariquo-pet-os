'use client'

/**
 * Bookings feed — vet-facing view of all upcoming and past appointments
 * across providers. Splits bookings into "Upcoming" and "History" groups and
 * surfaces provider, pet, service, time and status at a glance.
 */

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarClock,
  CalendarDays,
  Clock,
  MapPin,
  PawPrint,
  Stethoscope,
} from 'lucide-react'

import { useApp } from '@/lib/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import {
  bookingStatusMeta,
  formatDateTime,
  initials,
  relativeTime,
  speciesLabel,
  truncate,
  type Booking,
} from './professional-meta'

interface BookingsFeedProps {
  className?: string
}

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  VETERINARIAN: 'Veterinarian',
  GROOMER: 'Groomer',
  BOARDING: 'Boarding',
  WALKER: 'Dog walker',
  TRAINER: 'Trainer',
  SITTER: 'Pet sitter',
  TRANSPORT: 'Transport',
  PHARMACY: 'Pharmacy',
  PET_SHOP: 'Pet shop',
}

function providerTypeLabel(t?: string | null) {
  if (!t) return 'Provider'
  return PROVIDER_TYPE_LABELS[t.toUpperCase()] ?? t
}

export function BookingsFeed({ className }: BookingsFeedProps) {
  const setSection = useApp((s) => s.setSection)
  const openPet = useApp((s) => s.openPet)

  const bookingsQuery = useQuery({
    queryKey: ['professional', 'bookings'],
    queryFn: async () => {
      const r = await fetch('/api/bookings')
      if (!r.ok) throw new Error('Failed to fetch bookings')
      const data = (await r.json()) as { bookings: Booking[] }
      return data.bookings
    },
  })

  if (bookingsQuery.isLoading) return <BookingsSkeleton />

  if (bookingsQuery.isError || !bookingsQuery.data) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <CalendarClock className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Could not load bookings.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => bookingsQuery.refetch()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const bookings = bookingsQuery.data
  const upcoming = bookings
    .filter((b) => new Date(b.scheduledAt).getTime() >= Date.now() && b.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  const past = bookings
    .filter((b) => new Date(b.scheduledAt).getTime() < Date.now() || b.status === 'CANCELLED')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

  if (bookings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <CalendarDays className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No bookings have been made yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleViewPet = (petId?: string | null) => {
    if (!petId) return
    openPet(petId)
    setSection('pet-detail')
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <BookingGroup
        title="Upcoming"
        icon={<CalendarClock className="size-4" />}
        bookings={upcoming}
        onViewPet={handleViewPet}
        emptyText="No upcoming bookings."
      />
      <BookingGroup
        title="History"
        icon={<CalendarDays className="size-4" />}
        bookings={past}
        onViewPet={handleViewPet}
        emptyText="No past bookings."
        muted
      />
    </div>
  )
}

interface BookingGroupProps {
  title: string
  icon: React.ReactNode
  bookings: Booking[]
  onViewPet: (petId?: string | null) => void
  emptyText: string
  muted?: boolean
}

function BookingGroup({
  title,
  icon,
  bookings,
  onViewPet,
  emptyText,
  muted,
}: BookingGroupProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-semibold',
            muted ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {icon}
          {title}
        </span>
        <Badge variant="secondary" className="tabular-nums">
          {bookings.length}
        </Badge>
      </div>

      {bookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </CardContent>
        </Card>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto scroll-area-thin pr-1 -mr-1 flex flex-col gap-3">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} onViewPet={onViewPet} />
          ))}
        </div>
      )}
    </section>
  )
}

interface BookingRowProps {
  booking: Booking
  onViewPet: (petId?: string | null) => void
}

function BookingRow({ booking, onViewPet }: BookingRowProps) {
  const status = bookingStatusMeta(booking.status)
  const provider = booking.provider
  const service = booking.service
  const pet = booking.pet
  const isVet = provider?.type === 'VETERINARIAN'
  const ProviderIcon = isVet ? Stethoscope : PawPrint

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-10 ring-1 ring-border shrink-0">
            {provider?.avatarUrl ? (
              <AvatarImage
                src={provider.avatarUrl}
                alt={provider.name}
              />
            ) : null}
            <AvatarFallback className="bg-accent text-accent-foreground">
              <ProviderIcon className="size-4" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground truncate">
                    {provider?.name ?? 'Unknown provider'}
                  </span>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {providerTypeLabel(provider?.type)}
                  </Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {service?.name ?? 'General appointment'}
                  {provider?.clinic ? ` · ${provider.clinic}` : ''}
                </div>
              </div>

              <Badge
                variant="outline"
                className={cn(
                  'gap-1 ring-1 border-transparent',
                  status.color,
                  status.bg,
                  status.ring,
                )}
              >
                <span className={cn('size-1.5 rounded-full', status.dot)} />
                {status.label}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatDateTime(booking.scheduledAt)}
                <span className="text-muted-foreground/70">
                  · {relativeTime(booking.scheduledAt)}
                </span>
              </span>
              {provider?.city ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {provider.city}
                  {provider.country ? `, ${provider.country}` : ''}
                </span>
              ) : null}
            </div>

            {/* Pet link */}
            {pet ? (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
                <Avatar className="size-6 ring-1 ring-border">
                  {pet.photoUrl ? (
                    <AvatarImage src={pet.photoUrl} alt={pet.name} />
                  ) : null}
                  <AvatarFallback className="bg-accent text-accent-foreground text-[10px]">
                    {initials(pet.name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => onViewPet(pet.id)}
                  className="text-xs font-medium text-foreground hover:text-primary hover:underline underline-offset-2"
                >
                  {pet.name}
                </button>
                <span className="text-[11px] text-muted-foreground">
                  {speciesLabel(pet.species)}
                  {pet.breed ? ` · ${pet.breed}` : ''}
                </span>
              </div>
            ) : (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
                <PawPrint className="size-3.5" />
                No pet linked
              </div>
            )}

            {booking.notes ? (
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {truncate(booking.notes, 200)}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BookingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-24" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
