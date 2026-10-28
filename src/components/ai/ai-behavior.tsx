'use client'

import * as React from 'react'
import { apiError, errorMessage } from '@/lib/api-error'
import { HeartPulse, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  AiProvider,
  ChatMessage,
  ChatTypingIndicator,
  Chip,
  PetPicker,
  SectionHeader,
  useSelectedPet,
  type ChatMessageData,
} from './shared'

const SUGGESTIONS = [
  'My dog barks at the doorbell',
  'My cat hides when guests come',
  'How to stop leash pulling?',
  'My puppy chews everything',
]

function BehaviorInner() {
  const [selectedPet, setSelectedPet] = useSelectedPet()
  const [messages, setMessages] = React.useState<ChatMessageData[]>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(questionOverride?: string) {
    const q = (questionOverride ?? input).trim()
    if (!selectedPet) {
      toast.error('Please select a pet first.')
      return
    }
    if (!q || loading) return

    setMessages((m) => [...m, { role: 'user', content: q }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId: selectedPet, question: q }),
      })
      if (!res.ok) throw await apiError(res, 'Request failed')
      const data = (await res.json()) as { answer: string }
      setMessages((m) => [...m, { role: 'assistant', content: data.answer }])
    } catch (err) {
      toast.error(errorMessage(err, 'Could not get a response. Please try again.'))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const empty = messages.length === 0

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<HeartPulse className="size-5" />}
        title="AI Behavior Advisor"
        subhead="Ask about everyday behavior — barking, leash manners, litter box issues, chewing, and more. Get force-free, evidence-informed guidance. For sudden behavior change, please consult your veterinarian to rule out pain or illness."
      />

      {/* Pet picker */}
      <section className="space-y-3" aria-labelledby="behavior-pet-label">
        <h2 id="behavior-pet-label" className="text-sm font-semibold">
          Select a pet
        </h2>
        <PetPicker value={selectedPet} onChange={setSelectedPet} />
      </section>

      {/* Chat */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* Messages */}
          <div
            ref={scrollRef}
            className="scroll-area-thin max-h-[60vh] space-y-4 overflow-y-auto pr-1"
            role="log"
            aria-live="polite"
            aria-label="Conversation"
          >
            {empty ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <HeartPulse className="size-5" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <div className="text-base font-semibold">
                    Ask about behavior
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Force-free, evidence-informed guidance for common
                    companion-animal behavior topics. For sudden behavior
                    change, a veterinarian can rule out pain or illness first.
                  </p>
                </div>
                <div className="flex max-w-md flex-wrap justify-center gap-2 pt-2">
                  {SUGGESTIONS.map((s) => (
                    <Chip
                      key={s}
                      onClick={() => send(s)}
                      disabled={loading || !selectedPet}
                    >
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <ChatMessage key={i} role={m.role} content={m.content} />
                ))}
                {loading && <ChatTypingIndicator />}
              </>
            )}
          </div>

          {/* Input */}
          <div className="space-y-2 border-t pt-3">
            <label htmlFor="behavior-input" className="sr-only">
              Your behavior question
            </label>
            <Textarea
              id="behavior-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the behavior and the situation…"
              className="min-h-11 resize-none"
              maxLength={1000}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              aria-describedby="behavior-send"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Enter to send · Shift+Enter for new line
              </p>
              <Button
                id="behavior-send"
                onClick={() => send()}
                disabled={loading || !input.trim() || !selectedPet}
                size="lg"
                className="min-h-[44px]"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AiBehavior() {
  return (
    <AiProvider>
      <BehaviorInner />
    </AiProvider>
  )
}
