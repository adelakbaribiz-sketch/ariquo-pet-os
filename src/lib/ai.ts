import 'server-only'
import ZAI from 'z-ai-web-dev-sdk'

/**
 * AI helpers for Ariquo (Pet/Animal OS).
 *
 * IMPORTANT SAFETY BOUNDARY (dossier §21):
 * The AI in Ariquo is framed as observation / screening / monitoring /
 * risk assessment / triage. It does NOT provide definitive veterinary
 * diagnosis. All outputs include explicit disclaimers and escalate to
 * a veterinarian where appropriate.
 */

export type RiskLevel =
  | 'OBSERVATION'
  | 'MONITOR'
  | 'VET_SOON'
  | 'EMERGENCY'
  | 'UNKNOWN'

export interface AIResult {
  observations: string
  riskLevel: RiskLevel
  confidence: number
  recommendations: string
  escalation?: string | null
  disclaimer: string
}

let zaiSingleton: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZai() {
  if (!zaiSingleton) zaiSingleton = await ZAI.create()
  return zaiSingleton
}

const DISCLAIMER =
  'Ariquo AI provides observation and screening only — not a definitive veterinary diagnosis. When in doubt, contact your veterinarian.'

const SAFETY_PREAMBLE = `You are Ariquo, an AI pet-health assistant. You provide OBSERVATION, SCREENING, RISK ASSESSMENT and TRIAGE for companion animals (dogs and cats in the current scope).

CRITICAL SAFETY RULES:
- You are NOT a substitute for a veterinarian.
- You never provide a definitive diagnosis.
- You distinguish clearly between: observation, monitoring at home, "see veterinarian soon" (within days), and "emergency" (immediate care).
- For any acute distress (breathing difficulty, persistent vomiting, seizures, severe bleeding, collapse, bloated abdomen in dogs, blocked cat, etc.) you classify as EMERGENCY.
- Always recommend professional veterinary evaluation when uncertain.
- Be calm, clear, practical. Use short bullet points.
- Keep responses under 350 words.

You MUST output a single JSON object with these exact fields:
{
  "observations": "string — what you notice / likely considerations / differentials",
  "riskLevel": "OBSERVATION" | "MONITOR" | "VET_SOON" | "EMERGENCY",
  "confidence": "number between 0 and 1",
  "recommendations": "string — concrete next steps for the owner",
  "escalation": "string or null — when to escalate and to whom"
}
Output JSON only, no prose outside the JSON.`

function parseAIJson(raw: string): Partial<AIResult> {
  // Extract first {...} block.
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return {}
  try {
    return JSON.parse(match[0])
  } catch {
    return {}
  }
}

function normalizeRisk(level: unknown): RiskLevel {
  const l = String(level ?? '').toUpperCase()
  if (['OBSERVATION', 'MONITOR', 'VET_SOON', 'EMERGENCY'].includes(l))
    return l as RiskLevel
  return 'UNKNOWN'
}

function buildResult(parsed: Partial<AIResult>): AIResult {
  return {
    observations:
      parsed.observations ??
      'The AI could not produce a structured observation. Please consult a veterinarian.',
    riskLevel: normalizeRisk(parsed.riskLevel),
    confidence:
      typeof parsed.confidence === 'number' ? parsed.confidence : 0.4,
    recommendations:
      parsed.recommendations ??
      'Monitor your pet closely. If symptoms persist or worsen, contact a veterinarian.',
    escalation: parsed.escalation ?? null,
    disclaimer: DISCLAIMER,
  }
}

export interface PetContext {
  name: string
  species: string
  breed?: string | null
  sex?: string | null
  ageYears?: number | null
  weightKg?: number | null
  neutered?: boolean
  allergies?: string | null
  recentHistory?: string
}

function petContextLine(c: PetContext): string {
  const age = c.ageYears != null ? `${c.ageYears} years` : 'age unknown'
  return [
    `Pet: ${c.name}`,
    `Species: ${c.species}`,
    c.breed ? `Breed: ${c.breed}` : null,
    c.sex ? `Sex: ${c.sex}` : null,
    `Age: ${age}`,
    c.weightKg != null ? `Weight: ${c.weightKg} kg` : null,
    c.neutered ? `Neutered: yes` : null,
    c.allergies ? `Known allergies: ${c.allergies}` : null,
    c.recentHistory ? `Recent history: ${c.recentHistory}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

/** Symptom / text-based AI triage */
export async function analyzeSymptom(
  userText: string,
  pet: PetContext,
): Promise<AIResult> {
  try {
    const zai = await getZai()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SAFETY_PREAMBLE },
        {
          role: 'user',
          content: `Pet profile:\n${petContextLine(pet)}\n\nOwner observation:\n${userText}\n\nProvide your triage JSON now.`,
        },
      ],
      thinking: { type: 'disabled' },
    })
    const raw = completion.choices[0]?.message?.content ?? ''
    return buildResult(parseAIJson(raw))
  } catch (err) {
    console.error('[ai.analyzeSymptom]', err)
    return {
      observations: 'Unable to reach AI triage service right now.',
      riskLevel: 'UNKNOWN',
      confidence: 0,
      recommendations:
        'If your pet is in acute distress (breathing difficulty, collapse, seizures, severe bleeding, repeated vomiting, inability to urinate), go to the nearest emergency veterinarian immediately.',
      escalation: 'Emergency vet if acute distress',
      disclaimer: DISCLAIMER,
    }
  }
}

/** Vision-based image analysis (skin / dental / eye / ear / general). */
export async function analyzeImage(
  imageDataUrl: string,
  module: 'VISION_SKIN' | 'VISION_DENTAL' | 'VISION_EYE' | 'VISION_EAR' | 'VISION_GENERAL',
  pet: PetContext,
): Promise<AIResult> {
  const modulePrompts: Record<typeof module, string> = {
    VISION_SKIN:
      'Analyze this image of the pet’s skin/coat for visible changes (redness, hair loss, masses, lesions, scaling, parasites). Do NOT diagnose — observe and triage.',
    VISION_DENTAL:
      'Analyze this image of the pet’s mouth/teeth for visible changes (tartar, gum redness, broken/missing teeth, masses). Do NOT diagnose — observe and triage.',
    VISION_EYE:
      'Analyze this image of the pet’s eye for visible changes (redness, discharge, cloudiness, asymmetry, swelling). Do NOT diagnose — observe and triage.',
    VISION_EAR:
      'Analyze this image of the pet’s ear for visible changes (redness, discharge, wax, swelling). Do NOT diagnose — observe and triage.',
    VISION_GENERAL:
      'Analyze this image for any visible abnormality on or around the pet. Do NOT diagnose — observe and triage.',
  }

  try {
    const zai = await getZai()
    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: SAFETY_PREAMBLE },
            {
              type: 'text',
              text: `Pet profile:\n${petContextLine(pet)}\n\n${modulePrompts[module]}\n\nReturn your triage JSON only.`,
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })
    const raw = completion.choices[0]?.message?.content ?? ''
    return buildResult(parseAIJson(raw))
  } catch (err) {
    console.error('[ai.analyzeImage]', err)
    return {
      observations: 'Unable to reach AI vision service right now.',
      riskLevel: 'UNKNOWN',
      confidence: 0,
      recommendations:
        'If the area looks infected, swollen, painful, or is getting worse, contact your veterinarian.',
      escalation: 'Veterinarian if worsening',
      disclaimer: DISCLAIMER,
    }
  }
}

/** Nutrition advisor — non-diagnostic. */
export async function nutritionAdvice(
  question: string,
  pet: PetContext,
): Promise<string> {
  try {
    const zai = await getZai()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are Ariquo’s AI Nutritionist. Provide practical, evidence-informed nutrition guidance for companion animals. Do NOT diagnose. Be concise (max 220 words). Use short paragraphs or bullet points. Always recommend consulting a veterinarian for medical nutrition (kidney disease, diabetes, allergies, weight-loss plans). Pet profile:\n${petContextLine(pet)}`,
        },
        { role: 'user', content: question },
      ],
      thinking: { type: 'disabled' },
    })
    const text = completion.choices[0]?.message?.content ?? ''
    return `${text}\n\n*${DISCLAIMER}*`
  } catch (err) {
    console.error('[ai.nutritionAdvice]', err)
    return `I couldn’t reach the AI nutrition service right now. For medical nutrition needs (allergies, kidney disease, diabetes, weight loss), please consult your veterinarian.\n\n*${DISCLAIMER}*`
  }
}

/** Behavior advisor — non-diagnostic. */
export async function behaviorAdvice(
  question: string,
  pet: PetContext,
): Promise<string> {
  try {
    const zai = await getZai()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are Ariquo’s AI Behavior Advisor. Provide practical, force-free, evidence-informed guidance for common companion-animal behavior topics. Be concise (max 220 words). Use bullet points. Always recommend a qualified trainer/behaviorist or veterinarian for serious or sudden behavior change (possible pain or illness). Pet profile:\n${petContextLine(pet)}`,
        },
        { role: 'user', content: question },
      ],
      thinking: { type: 'disabled' },
    })
    const text = completion.choices[0]?.message?.content ?? ''
    return `${text}\n\n*${DISCLAIMER}*`
  } catch (err) {
    console.error('[ai.behaviorAdvice]', err)
    return `I couldn’t reach the AI behavior service right now. For sudden behavior change, please consult your veterinarian to rule out pain or illness.\n\n*${DISCLAIMER}*`
  }
}

/** Generate an AI summary of a pet’s longitudinal record (for professional dashboard). */
export async function summarizePetHistory(
  pet: PetContext,
  events: { type: string; title: string; date: string; notes?: string | null }[],
): Promise<string> {
  try {
    const zai = await getZai()
    const eventsText = events
      .slice(0, 25)
      .map(
        (e) =>
          `- ${new Date(e.date).toLocaleDateString()} — [${e.type}] ${e.title}${e.notes ? `: ${e.notes}` : ''}`,
      )
      .join('\n')

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are Ariquo’s AI Clinical Summarizer. Produce a brief clinical summary (max 180 words) of the pet’s longitudinal record for a veterinarian. Use bullet points. Highlight: chronic conditions, recent events, vaccinations due, medications, and follow-ups. Do NOT diagnose — only summarize what is documented. Pet profile:\n${petContextLine(pet)}`,
        },
        {
          role: 'user',
          content: `Recorded events:\n${eventsText || 'No events recorded.'}`,
        },
      ],
      thinking: { type: 'disabled' },
    })
    return completion.choices[0]?.message?.content ?? 'No summary available.'
  } catch (err) {
    console.error('[ai.summarizePetHistory]', err)
    return 'Unable to generate AI summary at this time.'
  }
}
