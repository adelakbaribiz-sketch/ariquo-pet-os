'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Camera,
  Ear,
  Eye,
  ImageUp,
  Lightbulb,
  Loader2,
  MapPin,
  PawPrint,
  ScanLine,
  Smile,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/store'
import {
  AiLoading,
  AiProvider,
  EmptyState,
  PetPicker,
  RiskResultCard,
  SectionHeader,
  useSelectedPet,
  type AiResult,
} from './shared'

type VisionModule = 'VISION_SKIN' | 'VISION_DENTAL' | 'VISION_EYE' | 'VISION_EAR' | 'VISION_GENERAL'

const MODULES: {
  id: VisionModule
  label: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'VISION_SKIN', label: 'Skin & Coat', desc: 'Redness, hair loss, lesions', icon: Sparkles },
  { id: 'VISION_DENTAL', label: 'Dental', desc: 'Tartar, gum redness, broken teeth', icon: Smile },
  { id: 'VISION_EYE', label: 'Eye', desc: 'Redness, discharge, cloudiness', icon: Eye },
  { id: 'VISION_EAR', label: 'Ear', desc: 'Discharge, wax, swelling', icon: Ear },
  { id: 'VISION_GENERAL', label: 'General', desc: 'Any visible abnormality', icon: ScanLine },
]

const MAX_IMAGE_BYTES = 6 * 1024 * 1024 // 6 MB

function VisionInner() {
  const aiModule = useApp((s) => s.aiModule) as VisionModule
  const setAiModule = useApp((s) => s.setAiModule)
  const setSection = useApp((s) => s.setSection)
  const setProviderFilter = useApp((s) => s.setProviderFilter)

  const [selectedPet, setSelectedPet] = useSelectedPet()
  const [image, setImage] = React.useState<string | null>(null)
  const [context, setContext] = React.useState('')
  const [result, setResult] = React.useState<AiResult | null>(null)
  const [loading, setLoading] = React.useState(false)

  function reset() {
    setImage(null)
    setResult(null)
    setContext('')
  }

  async function submit() {
    if (!selectedPet) {
      toast.error('Please select a pet first.')
      return
    }
    if (!image) {
      toast.error('Please add an image to analyze.')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: selectedPet,
          module: aiModule,
          image,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Request failed')
      }
      const data = (await res.json()) as { result: AiResult }
      setResult(data.result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not analyze the image.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function findEmergencyVet() {
    setProviderFilter('VETERINARIAN')
    setSection('marketplace')
  }

  const isEmergency = result?.riskLevel === 'EMERGENCY'

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<Camera className="size-5" />}
        title="Vision AI — Observation & Screening"
        subhead="Upload a clear photo and Ariquo will observe visible changes. This is screening only — not a diagnosis. For anything painful, swollen, or worsening, contact your veterinarian."
      />

      {/* Pet picker */}
      <section className="space-y-3" aria-labelledby="vision-pet-label">
        <h2 id="vision-pet-label" className="text-sm font-semibold">
          Select a pet
        </h2>
        <PetPicker value={selectedPet} onChange={setSelectedPet} />
      </section>

      {/* Module selector */}
      <section className="space-y-3" aria-labelledby="vision-module-label">
        <h2 id="vision-module-label" className="text-sm font-semibold">
          What would you like to observe?
        </h2>
        <div
          role="radiogroup"
          aria-label="Vision module"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
        >
          {MODULES.map((m) => {
            const Icon = m.icon
            const selected = aiModule === m.id
            return (
              <button
                type="button"
                key={m.id}
                role="radio"
                aria-checked={selected}
                aria-label={`${m.label}: ${m.desc}`}
                onClick={() => setAiModule(m.id)}
                className={cn(
                  'flex min-h-[88px] flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  selected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30',
                )}
              >
                <Icon
                  className={cn(
                    'size-5',
                    selected ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <div className="text-sm font-semibold">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.desc}</div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Uploader + context */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <label htmlFor="vision-image" className="text-sm font-semibold">
              Upload an image
            </label>
            <Dropzone value={image} onChange={setImage} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <label htmlFor="vision-context" className="text-sm font-semibold">
              Anything else we should know?
              <span className="font-normal text-muted-foreground"> (optional)</span>
            </label>
            <Textarea
              id="vision-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Itchy for 3 days, not painful to touch, appeared suddenly."
              className="min-h-32 resize-y"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {context.length}/500 characters
            </p>

            {/* Tips */}
            <Alert className="border-dashed bg-muted/30">
              <Lightbulb className="h-4 w-4 text-primary" />
              <AlertTitle className="text-sm">Tips for best results</AlertTitle>
              <AlertDescription>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">
                  <li>Good lighting — avoid shadows and glare</li>
                  <li>Get close, but keep the area in focus</li>
                  <li>Hold steady — blur reduces accuracy</li>
                  <li>Multiple angles help if you&apos;re unsure</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Submit */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {image ? 'Image ready' : 'Add an image and pet to continue'}
        </p>
        <div className="flex gap-2">
          {(image || result) && (
            <Button
              variant="ghost"
              onClick={reset}
              disabled={loading}
              className="min-h-[44px]"
            >
              Reset
            </Button>
          )}
          <Button
            onClick={submit}
            disabled={loading || !selectedPet || !image}
            size="lg"
            className="min-h-[44px]"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <ImageUp className="size-4" />
                Analyze image
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Emergency banner */}
      {isEmergency && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
        >
          <Alert
            variant="destructive"
            className="border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
          >
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
            <AlertTitle className="text-base text-red-800 dark:text-red-200">
              This may be an emergency
            </AlertTitle>
            <AlertDescription className="text-red-800 dark:text-red-200">
              The signs visible in this image can be associated with serious,
              acute conditions. If your pet is in distress — breathing difficulty,
              collapse, severe bleeding, repeated vomiting, or inability to urinate —
              go to the nearest emergency veterinarian immediately.
              <div className="mt-3">
                <Button
                  variant="destructive"
                  onClick={findEmergencyVet}
                  className="min-h-[44px]"
                >
                  <MapPin className="size-4" />
                  Find emergency vet
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Result / loading / empty */}
      {loading ? (
        <AiLoading label="Reading the image and matching observations…" />
      ) : result ? (
        <div className="grid gap-4 md:grid-cols-3">
          {image && (
            <Card className="overflow-hidden md:col-span-1">
              <div className="aspect-square w-full bg-muted">
                <img
                  src={image}
                  alt="Analyzed pet image"
                  className="size-full object-cover"
                />
              </div>
            </Card>
          )}
          <div className="md:col-span-2">
            <RiskResultCard result={result} />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<PawPrint className="size-6" />}
          title="Add a photo to begin"
          description="Ariquo will observe visible changes in the area you select and help you decide whether to monitor at home or call your veterinarian."
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
//  Dropzone
// ─────────────────────────────────────────────

function Dropzone({
  value,
  onChange,
}: {
  value: string | null
  onChange: (v: string | null) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = React.useState(false)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG or PNG).')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image too large. Maximum 6 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      onChange(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.onerror = () => toast.error('Could not read that file. Try another.')
    reader.readAsDataURL(file)
  }

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-lg border">
        {/* Preview thumbnail */}
        <img
          src={value}
          alt="Selected pet image"
          className="max-h-72 w-full object-cover"
        />
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onChange(null)}
          className="absolute right-2 top-2 min-h-[36px]"
        >
          <X className="size-4" />
          Remove
        </Button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f) handleFile(f)
      }}
      aria-label="Upload image of the affected area"
      className={cn(
        'flex min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 py-12 text-center transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        dragOver
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border hover:border-primary/40 hover:bg-accent/20',
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Upload className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Click to upload or drag and drop</p>
        <p className="text-xs text-muted-foreground">JPG, PNG up to 6 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
    </button>
  )
}

export function AiVision() {
  return (
    <AiProvider>
      <VisionInner />
    </AiProvider>
  )
}
