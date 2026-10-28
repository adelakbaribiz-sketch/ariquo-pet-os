'use client'

// Reusable dialog for creating or editing a Pet.
// Used by both <PetList /> (create) and <PetDetail /> (edit).
//
// The form lives in a dedicated <AddPetForm /> child that is mounted only
// while the dialog is open. This keeps initial state derivation in the
// `useState` initializer (no `useEffect`-driven `setState`).

import { useState } from 'react'
import { Loader2, PawPrint } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreatePet, useUpdatePet, type PetInput } from '@/lib/pet-hooks'
import {
  SPECIES_OPTIONS,
  dateInputValue,
  type Pet,
} from '@/lib/pet-utils'
import { cn } from '@/lib/utils'

interface AddPetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: 'create' | 'edit'
  pet?: Pet | null // when editing
  onSaved?: (pet: Pet) => void
}

export function AddPetDialog({
  open,
  onOpenChange,
  mode = 'create',
  pet,
  onSaved,
}: AddPetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto scroll-area-thin sm:max-w-2xl">
        {open ? (
          <AddPetForm
            mode={mode}
            pet={pet ?? null}
            onSaved={onSaved}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
//  Form (mounted fresh each time the dialog opens)
// ─────────────────────────────────────────────

interface FormState {
  name: string
  species: string
  breed: string
  sex: string
  birthDate: string
  weightKg: string
  microchipId: string
  photoUrl: string
  color: string
  neutered: boolean
  allergies: string
  notes: string
}

const emptyForm: FormState = {
  name: '',
  species: 'DOG',
  breed: '',
  sex: 'UNKNOWN',
  birthDate: '',
  weightKg: '',
  microchipId: '',
  photoUrl: '',
  color: '',
  neutered: false,
  allergies: '',
  notes: '',
}

function fromPet(pet?: Pet | null): FormState {
  if (!pet) return emptyForm
  return {
    name: pet.name ?? '',
    species: pet.species ?? 'DOG',
    breed: pet.breed ?? '',
    sex: pet.sex ?? 'UNKNOWN',
    birthDate: dateInputValue(pet.birthDate),
    weightKg: pet.weightKg != null ? String(pet.weightKg) : '',
    microchipId: pet.microchipId ?? '',
    photoUrl: pet.photoUrl ?? '',
    color: pet.color ?? '',
    neutered: !!pet.neutered,
    allergies: pet.allergies ?? '',
    notes: pet.notes ?? '',
  }
}

function AddPetForm({
  mode,
  pet,
  onSaved,
  onDone,
}: {
  mode: 'create' | 'edit'
  pet: Pet | null
  onSaved?: (pet: Pet) => void
  onDone: () => void
}) {
  const isEdit = mode === 'edit' && !!pet
  const [form, setForm] = useState<FormState>(() =>
    isEdit ? fromPet(pet) : emptyForm,
  )
  const createMut = useCreatePet()
  const updateMut = useUpdatePet(pet?.id ?? '')

  const pending = createMut.isPending || updateMut.isPending

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please enter your pet\'s name')
      return
    }
    if (!form.species) {
      toast.error('Please choose a species')
      return
    }

    const payload: PetInput = {
      name: form.name.trim(),
      species: form.species,
      breed: form.breed.trim() || undefined,
      sex: form.sex || undefined,
      birthDate: form.birthDate || undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      microchipId: form.microchipId.trim() || undefined,
      photoUrl: form.photoUrl.trim() || undefined,
      color: form.color.trim() || undefined,
      neutered: form.neutered,
      allergies: form.allergies.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }

    const handle = (savedPet: Pet) => {
      toast.success(
        isEdit
          ? `${savedPet.name}'s profile updated`
          : `${savedPet.name} added to your pets`,
      )
      onSaved?.(savedPet)
      onDone()
    }

    if (isEdit) {
      updateMut.mutate(payload, {
        onSuccess: (res) => handle(res.pet),
        onError: (err: Error) =>
          toast.error(err.message || 'Failed to update pet'),
      })
    } else {
      createMut.mutate(payload, {
        onSuccess: (res) => handle(res.pet),
        onError: (err: Error) =>
          toast.error(err.message || 'Failed to add pet'),
      })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <PawPrint className="size-5 text-primary" />
          {isEdit ? `Edit ${pet?.name}` : 'Add a new pet'}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update your pet\'s profile, identity and care notes.'
            : 'Create your pet\'s lifelong digital profile. You can change everything later.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {/* Identity */}
        <fieldset className="grid gap-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Identity
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Milo"
                required
                maxLength={60}
              />
            </Field>
            <Field label="Species" required>
              <Select value={form.species} onValueChange={(v) => set('species', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available now</SelectLabel>
                    {SPECIES_OPTIONS.filter((o) => !o.soon).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <span className="mr-1">{o.emoji}</span> {o.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Coming soon</SelectLabel>
                    {SPECIES_OPTIONS.filter((o) => o.soon).map((o) => (
                      <SelectItem key={o.value} value={o.value} disabled>
                        <span className="mr-1">{o.emoji}</span> {o.label}
                        <span className="ml-2 text-xs text-muted-foreground">
                          (soon)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Breed">
              <Input
                value={form.breed}
                onChange={(e) => set('breed', e.target.value)}
                placeholder="e.g. Golden Retriever"
                maxLength={80}
              />
            </Field>
            <Field label="Sex">
              <Select value={form.sex} onValueChange={(v) => set('sex', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="UNKNOWN">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date of birth">
              <Input
                type="date"
                value={form.birthDate}
                onChange={(e) => set('birthDate', e.target.value)}
                max={dateInputValue(new Date().toISOString())}
              />
            </Field>
            <Field label="Weight (kg)">
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={form.weightKg}
                onChange={(e) => set('weightKg', e.target.value)}
                placeholder="e.g. 4.8"
              />
            </Field>
            <Field label="Coat color">
              <Input
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
                placeholder="e.g. Golden"
                maxLength={40}
              />
            </Field>
            <Field label="Microchip ID">
              <Input
                value={form.microchipId}
                onChange={(e) => set('microchipId', e.target.value)}
                placeholder="15-digit ISO chip"
                maxLength={40}
              />
            </Field>
          </div>
        </fieldset>

        {/* Photo URL */}
        <Field
          label="Photo URL"
          help="A square image works best. Paste a direct image link."
        >
          <Input
            type="url"
            value={form.photoUrl}
            onChange={(e) => set('photoUrl', e.target.value)}
            placeholder="https://..."
          />
        </Field>

        {/* Care notes */}
        <fieldset className="grid gap-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Care notes
          </legend>
          <div className="grid gap-4">
            <Field label="Allergies" help="Comma-separated list of known allergens.">
              <Input
                value={form.allergies}
                onChange={(e) => set('allergies', e.target.value)}
                placeholder="e.g. Chicken protein, pollen"
              />
            </Field>
            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Temperament, routines, anything a vet or sitter should know…"
                rows={3}
              />
            </Field>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-3">
              <div>
                <div className="text-sm font-medium">Neutered / spayed</div>
                <div className="text-xs text-muted-foreground">
                  Mark if your pet has been surgically sterilised.
                </div>
              </div>
              <Switch
                checked={form.neutered}
                onCheckedChange={(v) => set('neutered', v)}
                aria-label="Toggle neutered"
              />
            </div>
          </div>
        </fieldset>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onDone}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending} className="min-w-32">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Add pet'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

function Field({
  label,
  required,
  help,
  children,
  className,
}: {
  label: string
  required?: boolean
  help?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label>
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  )
}
