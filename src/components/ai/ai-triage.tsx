'use client'

import * as React from 'react'
import { apiError, errorMessage } from '@/lib/api-error'
import { motion } from 'framer-motion'
import { Activity, AlertTriangle, Loader2, MapPin, Send, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useApp } from '@/lib/store'
import {
  AiLoading,
  AiProvider,
  Chip,
  EmptyState,
  PetPicker,
  RiskResultCard,
  SectionHeader,
  useSelectedPet,
  type AiResult,
} from './shared'

const EXAMPLES = [
  'Vomiting since yesterday',
  'Limping on left front leg',
  'Drinking more water than usual',
  'Not eating since this morning',
]

const MAX_LEN = 2000

function TriageInner() {
  const setSection = useApp((s) => s.setSection)
  const setProviderFilter = useApp((s) => s.setProviderFilter)
  const [selectedPet, setSelectedPet] = useSelectedPet()
  const [text, setText] = React.useState('')
  const [result, setResult] = React.useState<AiResult | null>(null)
  const [loading, setLoading] = React.useState(false)

  async function submit() {
    if (!selectedPet) {
      toast.error('Please select a pet first.')
      return
    }
    if (text.trim().length < 3) {
      toast.error('Describe the symptom in a few more words.')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/symptom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId: selectedPet, text: text.trim() }),
      })
      if (!res.ok) throw await apiError(res, 'Request failed')
      const data = (await res.json()) as { result: AiResult }
      setResult(data.result)
    } catch (err) {
      toast.error(errorMessage(err, 'Could not analyze right now. Please try again.'))
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
        icon={<Stethoscope className="size-5" />}
        title="AI Symptom Triage"
        subhead="Describe what you're observing and Ariquo will help you understand how urgent it might be. This is observation and triage only — not a diagnosis."
      />

      {/* Pet picker */}
      <section className="space-y-3" aria-labelledby="triage-pet-label">
        <h2 id="triage-pet-label" className="text-sm font-semibold">
          Select a pet
        </h2>
        <PetPicker value={selectedPet} onChange={setSelectedPet} />
      </section>

      {/* Input */}
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <label htmlFor="triage-text" className="block text-sm font-semibold">
            Describe what you&apos;re observing
            <span className="font-normal text-muted-foreground">
              {' '}
              — be specific about timing, severity, and behavior changes.
            </span>
          </label>
          <Textarea
            id="triage-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            placeholder="e.g. My dog has been vomiting since yesterday evening, seems lethargic and won't eat."
            className="min-h-32 resize-y"
            maxLength={MAX_LEN}
            aria-describedby="triage-text-count"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {EXAMPLES.map((ex) => (
              <Chip key={ex} onClick={() => setText(ex)}>
                {ex}
              </Chip>
            ))}
          </div>
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p id="triage-text-count" className="text-xs text-muted-foreground">
              {text.length}/{MAX_LEN} characters
            </p>
            <Button
              onClick={submit}
              disabled={loading || !selectedPet || text.trim().length < 3}
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
                  <Send className="size-4" />
                  Analyze symptom
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

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
              If your pet is in acute distress — breathing difficulty, collapse,
              seizures, severe bleeding, repeated vomiting, or inability to urinate —
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
        <AiLoading label="Reviewing observations and matching triage patterns…" />
      ) : result ? (
        <RiskResultCard result={result} />
      ) : (
        <EmptyState
          icon={<Activity className="size-6" />}
          title="Describe a symptom to begin"
          description="Your triage result will appear here. Ariquo will flag the risk level, suggest concrete next steps, and tell you when to escalate to a veterinarian."
        />
      )}
    </div>
  )
}

export function AiTriage() {
  return (
    <AiProvider>
      <TriageInner />
    </AiProvider>
  )
}
