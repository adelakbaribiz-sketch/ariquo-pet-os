'use client'

/**
 * Patient table — the vet-facing browse view of all pets in the system.
 *
 * Uses TanStack Query. The pets list is fetched from `/api/pets` (returns
 * `_count` only); to surface "Last event" and "# AI assessments" we hydrate
 * each row by fetching `/api/pets/[id]`. Detail queries share the cache key
 * `['pet', petId]` with the AI-assessments feed so the two views stay in sync.
 *
 * On narrow screens the table collapses into stacked patient cards.
 */

import * as React from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  Activity,
  ChevronRight,
  ClipboardList,
  Eye,
  PawPrint,
  Sparkles,
} from 'lucide-react'

import { useApp } from '@/lib/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import {
  ageYears,
  formatAge,
  formatDate,
  initials,
  relativeTime,
  speciesLabel,
  truncate,
  type PetDetail,
  type PetListItem,
} from './professional-meta'

interface PatientTableProps {
  /** Called when the user clicks the "AI summary" action for a row. */
  onSummaryClick: (petId: string) => void
  className?: string
}

export function PatientTable({ onSummaryClick, className }: PatientTableProps) {
  const setSection = useApp((s) => s.setSection)
  const openPet = useApp((s) => s.openPet)

  const petsQuery = useQuery({
    queryKey: ['professional', 'pets'],
    queryFn: async () => {
      const r = await fetch('/api/pets')
      if (!r.ok) throw new Error('Failed to fetch patients')
      const data = (await r.json()) as { pets: PetListItem[] }
      return data.pets
    },
  })

  // Hydrate each row with full detail (last event, assessments count, etc).
  // Cache key is shared with the assessments feed so visits stay in sync.
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

  if (petsQuery.isLoading) {
    return <PatientTableSkeleton />
  }

  if (petsQuery.isError || !petsQuery.data) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <PawPrint className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Could not load patients. Please retry.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => petsQuery.refetch()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const pets = petsQuery.data
  if (pets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <PawPrint className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No patients registered yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Index detail results by pet id for O(1) lookup.
  const detailById = new Map<string, PetDetail | undefined>()
  pets.forEach((pet, idx) => {
    const q = detailQueries[idx]
    detailById.set(pet.id, q?.data)
  })

  const handleView = (petId: string) => {
    openPet(petId)
    setSection('pet-detail')
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Desktop / tablet table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="pl-4">Patient</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Breed</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Last event</TableHead>
                  <TableHead className="text-center">AI assessments</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pets.map((pet) => {
                  const detail = detailById.get(pet.id)
                  const lastEvent = detail?.events?.[0]
                  const assessmentsCount =
                    detail?.assessments?.length ?? pet._count?.assessments ?? 0
                  return (
                    <TableRow key={pet.id} className="group">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 ring-1 ring-border">
                            {pet.photoUrl ? (
                              <AvatarImage
                                src={pet.photoUrl}
                                alt={pet.name}
                              />
                            ) : null}
                            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-medium">
                              {initials(pet.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {pet.name}
                            </span>
                            {pet.microchipId ? (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {pet.microchipId}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{speciesLabel(pet.species)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {pet.breed || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatAge(pet.birthDate)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {pet.weightKg != null ? `${pet.weightKg} kg` : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {detail ? (
                          lastEvent ? (
                            <div className="flex flex-col">
                              <span className="text-sm text-foreground">
                                {truncate(lastEvent.title, 32)}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {formatDate(lastEvent.date)} ·{' '}
                                {relativeTime(lastEvent.date)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No events recorded
                            </span>
                          )
                        ) : (
                          <Skeleton className="h-4 w-28" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="tabular-nums"
                        >
                          {assessmentsCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSummaryClick(pet.id)}
                            className="min-h-11 md:min-h-9"
                          >
                            <Sparkles className="size-3.5" />
                            <span className="hidden lg:inline">AI summary</span>
                            <span className="lg:hidden">AI</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleView(pet.id)}
                            className="min-h-11 md:min-h-9"
                          >
                            <Eye className="size-3.5" />
                            <span className="hidden lg:inline">View</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {pets.map((pet) => {
          const detail = detailById.get(pet.id)
          const lastEvent = detail?.events?.[0]
          const assessmentsCount =
            detail?.assessments?.length ?? pet._count?.assessments ?? 0
          return (
            <Card key={pet.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-11 ring-1 ring-border">
                    {pet.photoUrl ? (
                      <AvatarImage src={pet.photoUrl} alt={pet.name} />
                    ) : null}
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm font-medium">
                      {initials(pet.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{pet.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {speciesLabel(pet.species)}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {pet.breed || 'Breed unknown'} · {formatAge(pet.birthDate)}{' '}
                      · {pet.weightKg != null ? `${pet.weightKg} kg` : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                    <Activity className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {detail
                        ? lastEvent
                          ? `${truncate(lastEvent.title, 40)} · ${relativeTime(lastEvent.date)}`
                          : 'No events recorded'
                        : 'Loading…'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <ClipboardList className="size-3.5" />
                    <span className="tabular-nums">{assessmentsCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-h-11"
                    onClick={() => onSummaryClick(pet.id)}
                  >
                    <Sparkles className="size-4" />
                    AI summary
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 min-h-11"
                    onClick={() => handleView(pet.id)}
                  >
                    <Eye className="size-4" />
                    View
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function PatientTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-3 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 4 }).map((_, r) => (
                <TableRow key={r}>
                  {Array.from({ length: 8 }).map((_, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-5 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 p-4 md:hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
