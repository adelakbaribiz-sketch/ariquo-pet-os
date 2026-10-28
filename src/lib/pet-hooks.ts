'use client'

// TanStack Query hooks for Ariquo pet data.
// All API routes use relative paths — Caddy handles routing.

import {
  useMutation,
  useQuery,
  useQueryClient,
  useQueries,
  type UseMutationResult,
} from '@tanstack/react-query'
import {
  type AIAssessment,
  type MedicalEvent,
  type Medication,
  type Pet,
  type PetDetail,
  type Reminder,
  type Vaccine,
} from '@/lib/pet-utils'

// ─────────────────────────────────────────────
//  Query keys (centralised so mutations can invalidate precisely)
// ─────────────────────────────────────────────

export const qk = {
  pets: ['pets'] as const,
  pet: (id: string) => ['pet', id] as const,
  petEvents: (id: string) => ['pet', id, 'events'] as const,
  petVaccines: (id: string) => ['pet', id, 'vaccines'] as const,
  petMedications: (id: string) => ['pet', id, 'medications'] as const,
  petReminders: (id: string) => ['pet', id, 'reminders'] as const,
  petWeight: (id: string) => ['pet', id, 'weight'] as const,
}

async function jsonOrThrow<T>(
  p: Promise<Response>,
  fallbackMsg: string,
): Promise<T> {
  const r = await p
  if (!r.ok) {
    let msg = fallbackMsg
    try {
      const body = await r.json()
      if (body?.error) msg = body.error
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  return r.json() as Promise<T>
}

// ─────────────────────────────────────────────
//  Reads
// ─────────────────────────────────────────────

export function usePets() {
  return useQuery<{ pets: Pet[] }>({
    queryKey: qk.pets,
    queryFn: () =>
      jsonOrThrow<{ pets: Pet[] }>(fetch('/api/pets'), 'Failed to load pets'),
    staleTime: 30_000,
  })
}

export function usePet(id: string | null | undefined) {
  return useQuery<{ pet: PetDetail }>({
    queryKey: qk.pet(id ?? 'unknown'),
    queryFn: () =>
      jsonOrThrow<{ pet: PetDetail }>(
        fetch(`/api/pets/${id}`),
        'Failed to load pet',
      ),
    enabled: !!id,
    staleTime: 30_000,
  })
}

// Fetch full details for many pets (used by dashboard home to aggregate
// reminders / medications / assessments across all pets).
export function usePetDetails(petIds: string[]) {
  const queries = useQueries({
    queries: petIds.map((id) => ({
      queryKey: qk.pet(id),
      queryFn: () =>
        jsonOrThrow<{ pet: PetDetail }>(
          fetch(`/api/pets/${id}`),
          'Failed to load pet',
        ),
      enabled: !!id,
      staleTime: 30_000,
    })),
  })
  const isLoading = queries.some((q) => q.isLoading)
  const isError = queries.some((q) => q.isError)
  const details = queries
    .map((q) => q.data?.pet)
    .filter((p): p is PetDetail => !!p)
  return { details, isLoading, isError }
}

// ─────────────────────────────────────────────
//  Pet create / update / delete
// ─────────────────────────────────────────────

export interface PetInput {
  name: string
  species: string
  breed?: string
  sex?: string
  birthDate?: string
  weightKg?: number | string
  microchipId?: string
  photoUrl?: string
  color?: string
  neutered?: boolean
  allergies?: string
  notes?: string
  status?: string
}

export function useCreatePet(): UseMutationResult<{ pet: Pet }, Error, PetInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PetInput) =>
      jsonOrThrow<{ pet: Pet }>(
        fetch('/api/pets', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        }),
        'Failed to create pet',
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pets })
    },
  })
}

export function useUpdatePet(
  id: string,
): UseMutationResult<{ pet: Pet }, Error, Partial<PetInput>> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<PetInput>) =>
      jsonOrThrow<{ pet: Pet }>(
        fetch(`/api/pets/${id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        }),
        'Failed to update pet',
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pets })
      qc.invalidateQueries({ queryKey: qk.pet(id) })
    },
  })
}

export function useDeletePet(): UseMutationResult<
  { ok: true },
  Error,
  string
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      jsonOrThrow<{ ok: true }>(
        fetch(`/api/pets/${id}`, { method: 'DELETE' }),
        'Failed to delete pet',
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pets })
    },
  })
}

// ─────────────────────────────────────────────
//  Events
// ─────────────────────────────────────────────

export interface EventInput {
  type: string
  title: string
  date: string
  notes?: string
  severity?: string
}

export function useAddEvent(
  petId: string,
): UseMutationResult<{ event: MedicalEvent }, Error, EventInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: EventInput) =>
      jsonOrThrow<{ event: MedicalEvent }>(
        fetch(`/api/pets/${petId}/events`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        }),
        'Failed to add event',
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pet(petId) })
    },
  })
}

// ─────────────────────────────────────────────
//  Vaccines
// ─────────────────────────────────────────────

export interface VaccineInput {
  name: string
  date: string
  nextDue?: string
  notes?: string
}

export function useAddVaccine(
  petId: string,
): UseMutationResult<{ vaccine: Vaccine }, Error, VaccineInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: VaccineInput) =>
      jsonOrThrow<{ vaccine: Vaccine }>(
        fetch(`/api/pets/${petId}/vaccines`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        }),
        'Failed to add vaccine',
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pet(petId) })
    },
  })
}

// ─────────────────────────────────────────────
//  Medications
// ─────────────────────────────────────────────

export interface MedicationInput {
  name: string
  dose?: string
  frequency?: string
  startDate?: string
  endDate?: string
  notes?: string
  active?: boolean
}

export function useAddMedication(
  petId: string,
): UseMutationResult<{ medication: Medication }, Error, MedicationInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MedicationInput) =>
      jsonOrThrow<{ medication: Medication }>(
        fetch(`/api/pets/${petId}/medications`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        }),
        'Failed to add medication',
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pet(petId) })
    },
  })
}

// ─────────────────────────────────────────────
//  Reminders
// ─────────────────────────────────────────────

export interface ReminderInput {
  title: string
  type: string
  dueAt: string
}

export function useAddReminder(
  petId: string,
): UseMutationResult<{ reminder: Reminder }, Error, ReminderInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReminderInput) =>
      jsonOrThrow<{ reminder: Reminder }>(
        fetch(`/api/pets/${petId}/reminders`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        }),
        'Failed to add reminder',
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pet(petId) })
      qc.invalidateQueries({ queryKey: qk.pets })
    },
  })
}

export function useToggleReminder(
  petId: string,
): UseMutationResult<
  { reminder: Reminder },
  Error,
  { reminderId: string; done: boolean; title?: string; type?: string; dueAt?: string }
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) =>
      jsonOrThrow<{ reminder: Reminder }>(
        fetch(`/api/pets/${petId}/reminders?reminderId=${input.reminderId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            done: input.done,
            title: input.title,
            type: input.type,
            dueAt: input.dueAt,
          }),
        }),
        'Failed to update reminder',
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pet(petId) })
      qc.invalidateQueries({ queryKey: qk.pets })
    },
  })
}

// ─────────────────────────────────────────────
//  Weight
// ─────────────────────────────────────────────

export function useLogWeight(
  petId: string,
): UseMutationResult<{ weightLog: unknown }, Error, { weightKg: number | string }> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) =>
      jsonOrThrow<{ weightLog: unknown }>(
        fetch(`/api/pets/${petId}/weight`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ weightKg: input.weightKg }),
        }),
        'Failed to log weight',
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pet(petId) })
    },
  })
}

// Convenience — flatten assessments across many pets
export function recentAssessments(details: PetDetail[]): AIAssessment[] {
  return details
    .flatMap((p) => p.assessments ?? [])
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
}
