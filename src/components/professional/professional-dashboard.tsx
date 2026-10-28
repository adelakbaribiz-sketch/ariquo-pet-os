'use client'

/**
 * Professional dashboard — the B2B / veterinarian view of Ariquo.
 *
 * Renders a clinic-style dashboard with:
 *   - Header + subhead + disclaimer badge
 *   - Stats row (# patients, # upcoming bookings (7d), # active meds, # AI assessments)
 *   - Tabs: Patients | AI Assessments | Bookings
 *
 * Owns its own TanStack Query client so the rest of the app does not need to
 * provide a provider. All child components share the cache via the same query
 * keys (`['professional','pets']`, `['pet', petId]`, etc).
 */

import * as React from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useQueries,
  useQuery,
} from '@tanstack/react-query'
import {
  CalendarClock,
  Pill,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import {
  AI_DISCLAIMER,
  isUpcoming,
  type Booking,
  type PetDetail,
  type PetListItem,
} from './professional-meta'
import { PatientTable } from './patient-table'
import { AiAssessmentsFeed } from './ai-assessments-feed'
import { BookingsFeed } from './bookings-feed'
import { AiSummaryDialog } from './ai-summary-dialog'

export function ProfessionalDashboard() {
  // One QueryClient for the whole professional view.
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  const [summaryPetId, setSummaryPetId] = React.useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = React.useState(false)

  const openSummary = React.useCallback((petId: string) => {
    setSummaryPetId(petId)
    setSummaryOpen(true)
  }, [])

  const handleOpenChange = React.useCallback((open: boolean) => {
    setSummaryOpen(open)
    if (!open) {
      // Keep petId around briefly to allow close animation, then clear.
      window.setTimeout(() => setSummaryPetId(null), 200)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <section
        aria-label="Professional dashboard"
        className="flex flex-col gap-6"
      >
        {/* Header */}
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Stethoscope className="size-6" />
              </span>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Professional Dashboard
                </h1>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Veterinarian view — AI-assisted clinical orientation across
                  all patients in the practice.
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 border-amber-200 bg-amber-50/70 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200 px-3 py-1.5"
            >
              <ShieldAlert className="size-3.5" />
              AI orientation only · not a diagnosis
            </Badge>
          </div>
        </header>

        {/* Stats row */}
        <StatsRow />

        {/* Tabs */}
        <Tabs defaultValue="patients" className="gap-4">
          <TabsList className="h-10">
            <TabsTrigger value="patients" className="gap-1.5 min-h-9">
              <Users className="size-4" />
              Patients
            </TabsTrigger>
            <TabsTrigger value="assessments" className="gap-1.5 min-h-9">
              <Sparkles className="size-4" />
              AI Assessments
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5 min-h-9">
              <CalendarClock className="size-4" />
              Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="mt-2">
            <PatientTable onSummaryClick={openSummary} />
          </TabsContent>
          <TabsContent value="assessments" className="mt-2">
            <AiAssessmentsFeed />
          </TabsContent>
          <TabsContent value="bookings" className="mt-2">
            <BookingsFeed />
          </TabsContent>
        </Tabs>

        {/* Bottom disclaimer (in addition to per-tab ones) */}
        <Alert className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900">
          <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            Clinical safety boundary
          </AlertTitle>
          <AlertDescription className="text-amber-800/90 dark:text-amber-200/80">
            {AI_DISCLAIMER} Verify all AI-derived observations against the
            longitudinal record and your own clinical exam before acting.
          </AlertDescription>
        </Alert>
      </section>

      <AiSummaryDialog
        petId={summaryPetId}
        open={summaryOpen}
        onOpenChange={handleOpenChange}
      />
    </QueryClientProvider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats row
// ─────────────────────────────────────────────────────────────────────────────

function StatsRow() {
  const petsQuery = useQuery({
    queryKey: ['professional', 'pets'],
    queryFn: async () => {
      const r = await fetch('/api/pets')
      if (!r.ok) throw new Error('Failed to fetch patients')
      const data = (await r.json()) as { pets: PetListItem[] }
      return data.pets
    },
  })

  const bookingsQuery = useQuery({
    queryKey: ['professional', 'bookings'],
    queryFn: async () => {
      const r = await fetch('/api/bookings')
      if (!r.ok) throw new Error('Failed to fetch bookings')
      const data = (await r.json()) as { bookings: Booking[] }
      return data.bookings
    },
  })

  // Hydrate full pet detail so we can count active medications & AI assessments.
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

  const isLoading =
    petsQuery.isLoading ||
    bookingsQuery.isLoading ||
    (petsQuery.data ? detailQueries.some((q) => q.isLoading) : false)

  const patientCount = petsQuery.data?.length ?? 0

  const upcomingBookings = React.useMemo(() => {
    if (!bookingsQuery.data) return 0
    return bookingsQuery.data.filter(
      (b) =>
        b.status !== 'CANCELLED' &&
        b.status !== 'COMPLETED' &&
        isUpcoming(b.scheduledAt, 7),
    ).length
  }, [bookingsQuery.data])

  const activeMedications = React.useMemo(() => {
    let total = 0
    detailQueries.forEach((q) => {
      const pet = q.data
      if (!pet?.medications) return
      total += pet.medications.filter((m) => m.active).length
    })
    return total
  }, [detailQueries])

  const totalAssessments = React.useMemo(() => {
    let total = 0
    detailQueries.forEach((q) => {
      const pet = q.data
      if (!pet?.assessments) return
      total += pet.assessments.length
    })
    return total
  }, [detailQueries])

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
      <StatCard
        label="Patients"
        value={isLoading ? null : patientCount}
        icon={<Users className="size-4" />}
        accent="text-primary bg-primary/10 ring-primary/20"
      />
      <StatCard
        label="Upcoming (7d)"
        value={isLoading ? null : upcomingBookings}
        icon={<CalendarClock className="size-4" />}
        accent="text-teal-700 bg-teal-50 dark:bg-teal-950/40 ring-teal-200 dark:ring-teal-900"
      />
      <StatCard
        label="Active medications"
        value={isLoading ? null : activeMedications}
        icon={<Pill className="size-4" />}
        accent="text-amber-700 bg-amber-50 dark:bg-amber-950/40 ring-amber-200 dark:ring-amber-900"
      />
      <StatCard
        label="AI assessments"
        value={isLoading ? null : totalAssessments}
        icon={<Sparkles className="size-4" />}
        accent="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 ring-emerald-200 dark:ring-emerald-900"
      />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number | null
  icon: React.ReactNode
  accent: string
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-3 p-4 md:p-5">
        <span
          className={cn(
            'inline-flex size-10 shrink-0 items-center justify-center rounded-lg ring-1',
            accent,
          )}
        >
          {icon}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground truncate">
            {label}
          </span>
          {value == null ? (
            <Skeleton className="mt-1 h-6 w-10" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {value}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
