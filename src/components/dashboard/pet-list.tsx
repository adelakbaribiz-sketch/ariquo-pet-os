'use client'

// Ariquo — Full pet list view.
// Grid of pet cards with search/filter and an "Add new pet" action.

import { useMemo, useState } from 'react'
import {
  CirclePlus,
  CircleAlert,
  PawPrint,
  Search,
  Pencil,
  Trash2,
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
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddPetDialog } from '@/components/dashboard/add-pet-dialog'
import { useApp } from '@/lib/store'
import { useDeletePet, usePets } from '@/lib/pet-hooks'
import {
  calcAge,
  speciesEmoji,
  speciesLabel,
  statusMeta,
  type Pet,
} from '@/lib/pet-utils'
import { cn } from '@/lib/utils'

const FILTERS = [
  { value: 'ALL', label: 'All pets' },
  { value: 'DOG', label: 'Dogs' },
  { value: 'CAT', label: 'Cats' },
  { value: 'LOST', label: 'Lost' },
  { value: 'DECEASED', label: 'In memoriam' },
] as const

export function PetList() {
  const { data, isLoading, error } = usePets()
  const pets = data?.pets ?? []
  const [addOpen, setAddOpen] = useState(false)
  const [editPet, setEditPet] = useState<Pet | null>(null)
  const [deletePet, setDeletePet] = useState<Pet | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>(
    'ALL',
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pets.filter((p) => {
      if (filter === 'LOST' && p.status !== 'LOST') return false
      if (filter === 'DECEASED' && p.status !== 'DECEASED') return false
      if (filter === 'DOG' && p.species !== 'DOG') return false
      if (filter === 'CAT' && p.species !== 'CAT') return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.breed ?? '').toLowerCase().includes(q) ||
        speciesLabel(p.species).toLowerCase().includes(q) ||
        (p.color ?? '').toLowerCase().includes(q)
      )
    })
  }, [pets, query, filter])

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

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <PawPrint className="size-5 text-primary" />
              Your pets
            </CardTitle>
            <CardDescription>
              {pets.length === 0
                ? 'No pets yet — add your first companion to begin.'
                : `${pets.length} ${pets.length === 1 ? 'pet' : 'pets'} in your care.`}
            </CardDescription>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="h-11 gap-2 self-start sm:self-auto"
          >
            <CirclePlus className="size-4" />
            Add new pet
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, breed, color…"
                className="pl-9"
                aria-label="Search pets"
              />
            </div>
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as (typeof FILTERS)[number]['value'])}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                {FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          query={query}
          hasPets={pets.length > 0}
          onAdd={() => setAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pet) => (
            <PetListCard
              key={pet.id}
              pet={pet}
              onEdit={() => setEditPet(pet)}
              onDelete={() => setDeletePet(pet)}
            />
          ))}
        </div>
      )}

      <AddPetDialog open={addOpen} onOpenChange={setAddOpen} />
      <AddPetDialog
        open={!!editPet}
        onOpenChange={(o) => !o && setEditPet(null)}
        mode="edit"
        pet={editPet}
      />
      <DeletePetDialog
        pet={deletePet}
        onClose={() => setDeletePet(null)}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
//  Pet list card
// ─────────────────────────────────────────────

function PetListCard({
  pet,
  onEdit,
  onDelete,
}: {
  pet: Pet
  onEdit: () => void
  onDelete: () => void
}) {
  const openPet = useApp((s) => s.openPet)
  const status = statusMeta(pet.status)
  const counts = pet._count

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group h-full overflow-hidden p-0 transition-colors hover:border-primary/40">
        <button
          type="button"
          onClick={() => openPet(pet.id)}
          className="block w-full text-left"
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
        </button>

        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => openPet(pet.id)}
              className="min-w-0 flex-1 text-left"
            >
              <h3 className="truncate text-base font-semibold leading-tight hover:text-primary">
                {pet.name}
              </h3>
              <p className="truncate text-xs text-muted-foreground">
                {speciesLabel(pet.species)}
                {pet.breed ? ` · ${pet.breed}` : ''}
              </p>
            </button>
            <Avatar className="size-9 ring-1 ring-border">
              <AvatarImage src={pet.photoUrl ?? undefined} alt={pet.name} />
              <AvatarFallback className="text-xs">
                {pet.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <MiniStat label="Age" value={calcAge(pet.birthDate)} />
            <MiniStat
              label="Weight"
              value={pet.weightKg != null ? `${pet.weightKg} kg` : '—'}
            />
            <MiniStat
              label="Vaccines"
              value={counts?.vaccines != null ? String(counts.vaccines) : '—'}
            />
            <MiniStat
              label="Events"
              value={counts?.events != null ? String(counts.events) : '—'}
            />
          </div>

          {pet.allergies ? (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Allergies:
              </span>
              {pet.allergies
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean)
                .slice(0, 3)
                .map((a) => (
                  <Badge
                    key={a}
                    variant="outline"
                    className="bg-rose-50 px-1.5 py-0 text-[10px] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  >
                    {a}
                  </Badge>
                ))}
            </div>
          ) : null}

          <div className="mt-1 flex items-center justify-end gap-1 border-t border-border pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 gap-1.5 px-2"
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 gap-1.5 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="truncate text-sm font-medium">{value}</div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Delete confirmation
// ─────────────────────────────────────────────

function DeletePetDialog({
  pet,
  onClose,
}: {
  pet: Pet | null
  onClose: () => void
}) {
  const del = useDeletePet()

  function confirm() {
    if (!pet) return
    del.mutate(pet.id, {
      onSuccess: () => {
        toast.success(`${pet.name}'s profile removed`)
        onClose()
      },
      onError: (err: Error) =>
        toast.error(err.message || 'Failed to delete pet'),
    })
  }

  return (
    <AlertDialog open={!!pet} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {pet?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove {pet?.name}&apos;s profile, health
            timeline, vaccines, medications, AI assessments and reminders. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={del.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {del.isPending ? 'Deleting…' : 'Delete pet'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─────────────────────────────────────────────
//  Empty state
// ─────────────────────────────────────────────

function EmptyState({
  query,
  hasPets,
  onAdd,
}: {
  query: string
  hasPets: boolean
  onAdd: () => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PawPrint className="size-6" />
        </div>
        <h3 className="text-base font-semibold">
          {hasPets
            ? 'No pets match your filters'
            : query
              ? 'No pets match your search'
              : 'No pets yet'}
        </h3>
        <p className="max-w-prose text-sm text-muted-foreground">
          {hasPets
            ? 'Try clearing the search or switching the filter above.'
            : 'Add your first companion to start their lifelong digital record.'}
        </p>
        {!hasPets && (
          <Button onClick={onAdd} className="mt-2 h-11 gap-2">
            <CirclePlus className="size-4" />
            Add a new pet
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
