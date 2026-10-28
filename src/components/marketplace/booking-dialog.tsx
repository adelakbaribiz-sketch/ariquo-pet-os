'use client'

import * as React from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Calendar,
  Check,
  Loader2,
  NotebookPen,
  PawPrint,
  Stethoscope,
  Tag,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Local shared types (kept self-contained to avoid cross-file cycles).
export type ProviderType =
  | 'VETERINARIAN'
  | 'GROOMING'
  | 'BOARDING'
  | 'WALKER'
  | 'TRAINER'
  | 'SITTER'
  | 'TRANSPORT'
  | 'PHARMACY'
  | 'PET_SHOP'

export interface MarketplaceService {
  id: string
  name: string
  description?: string | null
  durationMins?: number | null
  priceFrom?: number | null
  category: string
}

export interface MarketplaceProvider {
  id: string
  name: string
  type: ProviderType | string
  specialty?: string | null
  clinic?: string | null
  city: string
  country: string
  avatarUrl?: string | null
  rating: number
  reviewCount: number
  verified: boolean
  bio?: string | null
  services: MarketplaceService[]
  _count?: { bookings: number }
}

interface MarketplacePet {
  id: string
  name: string
  species: string
  breed?: string | null
  photoUrl?: string | null
}

interface BookingDialogProps {
  provider: MarketplaceProvider
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional preselected service id. */
  initialServiceId?: string
}

const NO_SERVICE = '__general__'
const NO_PET = '__none__'

/** Returns a default datetime-local value: 2 days from now at 10:00 local. */
function defaultScheduledAt(): string {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  d.setHours(10, 0, 0, 0)
  // datetime-local format: YYYY-MM-DDTHH:mm (no seconds, no tz).
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

/** Returns min datetime-local value: now (so user can't book in the past). */
function minScheduledAt(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
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
      return 'Grooming'
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

export function BookingDialog({
  provider,
  open,
  onOpenChange,
  initialServiceId,
}: BookingDialogProps) {
  const { data: petsData, isLoading: petsLoading } = useQuery<{
    pets: MarketplacePet[]
  }>({
    queryKey: ['pets'],
    queryFn: async () => {
      const res = await fetch('/api/pets')
      if (!res.ok) throw new Error('Failed to load pets')
      return res.json()
    },
    staleTime: 60_000,
  })
  const pets = petsData?.pets ?? []

  const [serviceId, setServiceId] = React.useState<string>(
    initialServiceId ?? NO_SERVICE,
  )
  const [petId, setPetId] = React.useState<string>(NO_PET)
  const [scheduledAt, setScheduledAt] = React.useState<string>(
    defaultScheduledAt(),
  )
  const [notes, setNotes] = React.useState<string>('')

  // Reset pet to "none" once pets load if it remains unset & a default pet exists.
  React.useEffect(() => {
    if (pets.length > 0 && petId === NO_PET) {
      setPetId(pets[0]!.id)
    }
  }, [pets, petId])

  const selectedService = React.useMemo(() => {
    if (!serviceId || serviceId === NO_SERVICE) return null
    return provider.services.find((s) => s.id === serviceId) ?? null
  }, [serviceId, provider.services])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        providerId: provider.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes: notes.trim() || null,
      }
      if (serviceId && serviceId !== NO_SERVICE) {
        payload.serviceId = serviceId
        payload.price = selectedService?.priceFrom ?? null
      }
      if (petId && petId !== NO_PET) payload.petId = petId

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Failed to create booking')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Booking requested', {
        description: `Saved as pending in your bookings. Prototype: ${provider.name} is not notified automatically.`,
      })
      onOpenChange(false)
      // Reset form for next time.
      setNotes('')
      setScheduledAt(defaultScheduledAt())
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      toast.error('Could not create booking', { description: msg })
    },
  })

  const canSubmit =
    !!scheduledAt && !mutation.isPending && !!provider?.id

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto scroll-area-thin"
        aria-describedby="booking-dialog-desc"
      >
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="size-12 ring-2 ring-primary/20">
              {provider.avatarUrl ? (
                <AvatarImage src={provider.avatarUrl} alt={provider.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {providerInitials(provider.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg leading-tight">
                Book with {provider.name}
              </DialogTitle>
              <DialogDescription id="booking-dialog-desc" className="mt-1">
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-primary/10 text-primary"
                  >
                    <Stethoscope className="size-3" />
                    {providerTypeLabel(provider.type)}
                  </Badge>
                  {provider.clinic ? (
                    <span className="truncate">{provider.clinic}</span>
                  ) : null}
                  <span className="text-muted-foreground/70">·</span>
                  <span className="truncate">
                    {provider.city}, {provider.country}
                  </span>
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
          {/* Service */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-service" className="gap-1.5">
              <Tag className="size-3.5 text-primary" />
              Service
            </Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger
                id="booking-service"
                className="w-full h-11"
                aria-label="Select a service"
              >
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SERVICE}>General enquiry</SelectItem>
                {provider.services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex flex-col items-start">
                      <span className="font-medium">{s.name}</span>
                      {s.priceFrom != null ? (
                        <span className="text-xs text-muted-foreground">
                          from €{s.priceFrom.toFixed(0)}
                          {s.durationMins ? ` · ${s.durationMins} min` : ''}
                        </span>
                      ) : null}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedService?.description ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedService.description}
              </p>
            ) : null}
          </div>

          {/* Pet */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-pet" className="gap-1.5">
              <PawPrint className="size-3.5 text-primary" />
              Pet
            </Label>
            <Select value={petId} onValueChange={setPetId}>
              <SelectTrigger
                id="booking-pet"
                className="w-full h-11"
                aria-label="Select a pet"
              >
                <SelectValue placeholder="Choose a pet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PET}>No specific pet</SelectItem>
                {pets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.breed ? ` · ${p.breed}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {petsLoading ? (
              <p className="text-xs text-muted-foreground">Loading your pets…</p>
            ) : null}
            {!petsLoading && pets.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No pets on file. You can still request a general appointment.
              </p>
            ) : null}
          </div>

          {/* Date + time */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-when" className="gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              Date &amp; time
            </Label>
            <Input
              id="booking-when"
              type="datetime-local"
              value={scheduledAt}
              min={minScheduledAt()}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="h-11"
              required
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-notes" className="gap-1.5">
              <NotebookPen className="size-3.5 text-primary" />
              Notes for the provider
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Milo has been limping on his left hind leg after long runs. He is friendly but nervous around strangers."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Price estimate */}
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                Estimated price
              </span>
              <span className="text-sm font-semibold text-foreground">
                {selectedService?.priceFrom != null
                  ? `from €${selectedService.priceFrom.toFixed(0)}`
                  : 'Determined at visit'}
              </span>
            </div>
            {selectedService?.durationMins ? (
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">Duration</span>
                <span className="text-sm font-medium">
                  ~{selectedService.durationMins} min
                </span>
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
              className="h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className={cn('h-11 min-w-[140px]')}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Requesting…
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Request booking
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
