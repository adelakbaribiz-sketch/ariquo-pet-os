'use client'

import * as React from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  Clock,
  Footprints,
  GraduationCap,
  Heart,
  Home,
  type LucideIcon,
  MapPin,
  PawPrint,
  Pill,
  Scissors,
  SearchX,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Star,
  StarHalf,
  Truck,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { BookingDialog, type MarketplaceProvider } from './booking-dialog'
import { BookingsList } from './bookings-list'

// ─────────────────────────────────────────────
//  Provider type taxonomy (dossier §14)
// ─────────────────────────────────────────────

const PROVIDER_TYPE_META: Record<
  string,
  { label: string; icon: LucideIcon }
> = {
  VETERINARIAN: { label: 'Veterinarian', icon: Stethoscope },
  GROOMING: { label: 'Grooming', icon: Scissors },
  BOARDING: { label: 'Boarding', icon: Home },
  WALKER: { label: 'Dog walker', icon: Footprints },
  TRAINER: { label: 'Trainer', icon: GraduationCap },
  SITTER: { label: 'Pet sitter', icon: Heart },
  TRANSPORT: { label: 'Transport', icon: Truck },
  PHARMACY: { label: 'Pharmacy', icon: Pill },
  PET_SHOP: { label: 'Pet shop', icon: ShoppingBag },
}

// Filter pills displayed in the marketplace header.
const FILTERS: {
  type: string | null
  label: string
  icon: LucideIcon
}[] = [
  { type: null, label: 'All', icon: Sparkles },
  { type: 'VETERINARIAN', label: 'Veterinarians', icon: Stethoscope },
  { type: 'GROOMING', label: 'Grooming', icon: Scissors },
  { type: 'BOARDING', label: 'Boarding', icon: Home },
  { type: 'WALKER', label: 'Walking', icon: Footprints },
  { type: 'TRAINER', label: 'Training', icon: GraduationCap },
  { type: 'SITTER', label: 'Sitting', icon: Heart },
  { type: 'TRANSPORT', label: 'Transport', icon: Truck },
]

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function providerInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  const rounded = Math.max(0, Math.min(5, rating))
  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role="img"
      aria-label={`${rounded.toFixed(1)} out of 5 stars`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const v = rounded - i
        if (v >= 0.75) {
          return (
            <Star
              key={i}
              className="size-3.5 fill-amber-400 text-amber-400"
            />
          )
        }
        if (v >= 0.25) {
          return (
            <StarHalf
              key={i}
              className="size-3.5 fill-amber-400 text-amber-400"
            />
          )
        }
        return <Star key={i} className="size-3.5 text-amber-400/35" />
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
//  Provider card
// ─────────────────────────────────────────────

function ProviderCard({ provider }: { provider: MarketplaceProvider }) {
  const [servicesOpen, setServicesOpen] = React.useState(false)
  const [bookingOpen, setBookingOpen] = React.useState(false)

  const typeMeta =
    PROVIDER_TYPE_META[provider.type] ?? {
      label: provider.type,
      icon: ShieldCheck,
    }
  const TypeIcon = typeMeta.icon

  return (
    <Card className="group flex flex-col gap-4 p-5 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40">
      <CardHeader className="px-0 pt-0 gap-3">
        <div className="flex items-start gap-3">
          <Avatar className="size-14 ring-2 ring-primary/10 shrink-0">
            {provider.avatarUrl ? (
              <AvatarImage
                src={provider.avatarUrl}
                alt={provider.name}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {providerInitials(provider.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1.5">
              <h3 className="font-semibold leading-tight truncate">
                {provider.name}
              </h3>
              {provider.verified ? (
                <BadgeCheck
                  className="size-4 shrink-0 text-primary"
                  aria-label="Verified provider"
                />
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Badge
                variant="secondary"
                className="gap-1 bg-primary/10 text-primary"
              >
                <TypeIcon className="size-3" />
                {typeMeta.label}
              </Badge>
              {provider.specialty ? (
                <span className="text-xs text-muted-foreground truncate">
                  {provider.specialty}
                </span>
              ) : null}
            </div>

            {provider.clinic ? (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {provider.clinic}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 gap-3 flex flex-col">
        {/* Rating + bookings */}
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <Stars rating={provider.rating} />
            <span className="font-semibold text-foreground">
              {provider.rating.toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              ({provider.reviewCount})
            </span>
          </span>
          {provider._count?.bookings ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Users className="size-3" />
              {provider._count.bookings} bookings
            </span>
          ) : null}
        </div>

        {/* Bio */}
        {provider.bio ? (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {provider.bio}
          </p>
        ) : null}

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 text-primary" />
          <span className="truncate">
            {provider.city}, {provider.country}
          </span>
        </div>
      </CardContent>

      {/* Services (collapsible) */}
      {provider.services.length > 0 ? (
        <Collapsible
          open={servicesOpen}
          onOpenChange={setServicesOpen}
          className="flex flex-col gap-2"
        >
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="justify-between h-9 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <PawPrint className="size-3.5 text-primary" />
                View services
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                  {provider.services.length}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  'size-3.5 transition-transform',
                  servicesOpen && 'rotate-180',
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <ul className="flex flex-col gap-1.5 rounded-lg border bg-secondary/40 p-2">
              {provider.services.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-3 rounded-md bg-card px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-tight truncate">
                      {s.name}
                    </p>
                    {s.description ? (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {s.description}
                      </p>
                    ) : null}
                    {s.durationMins ? (
                      <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <Clock className="size-3" />
                        {s.durationMins >= 60
                          ? `${(s.durationMins / 60).toFixed(s.durationMins % 60 === 0 ? 0 : 1)}h`
                          : `${s.durationMins} min`}
                      </p>
                    ) : null}
                  </div>
                  {s.priceFrom != null ? (
                    <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                      from €{s.priceFrom.toFixed(0)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      <CardFooter className="px-0 pt-0 mt-auto">
        <Button
          type="button"
          className="w-full h-11"
          onClick={() => setBookingOpen(true)}
        >
          <CalendarClock className="size-4" />
          Book appointment
        </Button>
      </CardFooter>

      <BookingDialog
        provider={provider}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />
    </Card>
  )
}

// ─────────────────────────────────────────────
//  Skeletons & empty state
// ─────────────────────────────────────────────

function ProviderCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}

function EmptyProviders({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
        <SearchX className="size-7 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {hasFilter
            ? 'No providers in this category yet'
            : 'No providers available right now'}
        </p>
        <p className="text-xs text-muted-foreground max-w-sm">
          {hasFilter
            ? 'Try a different category, or check back soon as we onboard more trusted caregivers.'
            : 'Please check back soon — we are onboarding trusted caregivers in your area.'}
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Filter bar
// ─────────────────────────────────────────────

function FilterBar() {
  const activeFilter = useApp((s) => s.activeProviderFilter)
  const setFilter = useApp((s) => s.setProviderFilter)

  return (
    <div
      role="tablist"
      aria-label="Filter providers by category"
      className="flex flex-wrap items-center gap-2"
    >
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.type
        const Icon = f.icon
        return (
          <button
            key={f.label}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setFilter(f.type)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 h-9 text-xs font-medium transition-all min-h-[44px]',
              isActive
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="size-3.5" />
            {f.label}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
//  Provider grid
// ─────────────────────────────────────────────

function ProviderGrid() {
  const activeFilter = useApp((s) => s.activeProviderFilter)

  const { data, isLoading, isError } = useQuery<{ providers: MarketplaceProvider[] }>({
    queryKey: ['providers', activeFilter],
    queryFn: async () => {
      const url = activeFilter
        ? `/api/providers?type=${encodeURIComponent(activeFilter)}`
        : '/api/providers'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load providers')
      return res.json()
    },
    staleTime: 60_000,
  })

  const providers = data?.providers ?? []

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ProviderCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive font-medium">
          Could not load providers
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Please refresh the page or try again later.
        </p>
      </div>
    )
  }

  if (providers.length === 0) {
    return <EmptyProviders hasFilter={!!activeFilter} />
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto scroll-area-thin pr-1 -mr-1">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.18) }}
          >
            <ProviderCard provider={p} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Marketplace (default export)
// ─────────────────────────────────────────────

function MarketplaceInner() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Ariquo Marketplace
          </span>
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
            Find trusted care for your pet
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5 max-w-2xl">
            Browse verified veterinarians, groomers, boarders, and caregivers in
            your area. Book with confidence — every provider is reviewed by
            real pet owners.
          </p>
        </div>
      </header>

      {/* Existing bookings */}
      <BookingsList />

      {/* Filter bar */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Browse providers
        </h2>
        <FilterBar />
      </div>

      {/* Provider grid */}
      <ProviderGrid />
    </div>
  )
}

// Self-contained QueryClient provider so the marketplace can be mounted
// anywhere without depending on a global provider being wired up at the
// layout level.
function useMarketplaceQueryClient() {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )
  return client
}

export function Marketplace() {
  const client = useMarketplaceQueryClient()
  return (
    <QueryClientProvider client={client}>
      <MarketplaceInner />
    </QueryClientProvider>
  )
}

export default Marketplace
