'use client'

/**
 * Ariquo — Landing Page
 *
 * Single-page marketing surface rendered when `useApp(s => s.view) === 'landing'`.
 * All CTAs that "enter the app" call `useApp(s => s.enterApp)(section)`.
 *
 * Design tokens: warm teal/emerald primary, coral accent. NO blue/indigo.
 * Sections: Navbar · Hero · Problem · Solution · AI Modules · Species ·
 *           Marketplace · B2B · Pricing · CTA · Footer
 */

import * as React from 'react'
import { motion, type Variants } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  PawPrint,
  Menu,
  Moon,
  Sun,
  ArrowRight,
  ArrowDown,
  ChevronRight,
  Activity,
  Stethoscope,
  ScanFace,
  Bone,
  Eye,
  Footprints,
  Scale,
  Brain,
  Pill,
  ShieldCheck,
  Siren,
  TriangleAlert,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  Turtle,
  Bug,
  Store,
  Home,
  Hotel,
  Scissors,
  GraduationCap,
  Truck,
  ShoppingBag,
  Building2,
  FileText,
  BarChart3,
  Users,
  ClipboardList,
  Sparkles,
  Check,
  HeartPulse,
  Layers,
  MapPin,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useApp, type AppSection } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Motion presets
// ---------------------------------------------------------------------------

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const viewportOnce = { once: true, amount: 0.2 } as const

// ---------------------------------------------------------------------------
// Theme toggle
// ---------------------------------------------------------------------------

function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const isDark = theme === 'dark'
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      className="size-9"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )
      ) : (
        <Sun className="size-4 opacity-0" />
      )}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Shared small components
// ---------------------------------------------------------------------------

function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'center' | 'left'
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 mb-10 sm:mb-14',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-balance">
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'text-sm sm:text-base text-muted-foreground max-w-2xl text-pretty',
            align === 'center' ? 'mx-auto' : '',
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Problem', href: '#problem' },
  { label: 'AI', href: '#ai' },
  { label: 'Marketplace', href: '#marketplace' },
  { label: 'Pricing', href: '#pricing' },
]

function BrandLogo() {
  return (
    <a
      href="#top"
      className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      aria-label="Ariquo home"
    >
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <PawPrint className="size-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight">Ariquo</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Pet OS
        </span>
      </span>
    </a>
  )
}

function Navbar() {
  const enterApp = useApp((s) => s.enterApp)
  const [scrolled, setScrolled] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-colors',
        scrolled
          ? 'bg-background/80 backdrop-blur-md border-border'
          : 'bg-transparent border-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <BrandLogo />

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/50"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button
            size="sm"
            className="hidden sm:inline-flex h-9 min-h-9"
            onClick={() => enterApp('dashboard')}
          >
            Open the app
            <ArrowRight className="size-4" />
          </Button>

          {/* Mobile sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open menu"
                className="size-9 md:hidden"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <PawPrint className="size-4" />
                  </span>
                  Ariquo
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 p-4">
                <Button
                  className="h-10 min-h-10"
                  onClick={() => {
                    setOpen(false)
                    enterApp('dashboard')
                  }}
                >
                  Open the app
                  <ArrowRight className="size-4" />
                </Button>
                <SheetClose asChild>
                  <Button variant="outline" className="h-10 min-h-10">
                    Close
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

const HERO_STATS = [
  { label: 'AI modules', value: '10' },
  { label: 'Service categories', value: '8' },
  { label: 'Lifelong record', value: '∞' },
] as const

function Hero() {
  const enterApp = useApp((s) => s.enterApp)

  const scrollToFeatures = () => {
    document
      .getElementById('problem')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section
      id="top"
      className="relative overflow-hidden border-b bg-grid"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 bg-radial-fade pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
        >
          <motion.div variants={fadeUp} className="flex flex-col gap-6">
            <Badge
              variant="outline"
              className="w-fit gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-primary"
            >
              <Sparkles className="size-3.5" />
              The Operating System for Animal Life
            </Badge>
            <h1
              id="hero-heading"
              className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl"
            >
              Give your pet a{' '}
              <span className="text-primary">lifelong digital home</span>
            </h1>
            <p className="max-w-xl text-base sm:text-lg text-muted-foreground text-pretty">
              Ariquo unifies pet identity, a longitudinal health record, AI
              observation &amp; triage, and a connected marketplace of
              veterinarians and caregivers — in one calm, beautifully designed
              place.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 min-h-11 text-base"
                onClick={() => enterApp('dashboard')}
              >
                Open the demo app
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 min-h-11 text-base"
                onClick={scrollToFeatures}
              >
                See how it works
              </Button>
            </div>

            <dl className="mt-2 grid grid-cols-3 gap-3 sm:max-w-md">
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border bg-card/60 p-3 text-center sm:text-left"
                >
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-foreground">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div variants={fadeUp} className="relative">
            <div className="relative overflow-hidden rounded-2xl border bg-card shadow-xl">
              <div className="aspect-[4/3] w-full overflow-hidden">
                {/* Using a plain img to avoid next/image remote domain config */}
                <img
                  src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&auto=format&fit=crop&q=80"
                  alt="A person relaxing with their dog — the heart of pet companionship"
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 rounded-xl border bg-background/85 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <PawPrint className="size-4" />
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold">Lifelong record</span>
                    <span className="text-[11px] text-muted-foreground">
                      Identity · timeline · AI · marketplace
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating mini-card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="absolute -right-3 -top-3 hidden sm:block"
            >
              <div className="flex items-center gap-2 rounded-xl border bg-card/90 p-3 shadow-md backdrop-blur">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <HeartPulse className="size-4" />
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold">AI triage</span>
                  <span className="text-[10px] text-muted-foreground">
                    Observation, not diagnosis
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Problem section
// ---------------------------------------------------------------------------

const PROBLEM_CARDS = [
  {
    icon: Layers,
    title: 'Fragmented care',
    description:
      'Vaccines, meds, weight, vet visits, sitters, grooming — scattered across notebooks, chats and a dozen apps.',
  },
  {
    icon: FileText,
    title: 'No unified record',
    description:
      'Owners retell the same history at every visit. Vets start over each time. Years of context simply vanish.',
  },
  {
    icon: TriangleAlert,
    title: 'Hard-to-read signals',
    description:
      'A limp, a duller coat, subtle weight change. Most owners notice too late — and panic without a calm next step.',
  },
  {
    icon: MapPin,
    title: 'Scattered services',
    description:
      'Finding a trusted vet, sitter, or groomer takes hours of search, messages and unverified recommendations.',
  },
] as const

function ProblemSection() {
  return (
    <section
      id="problem"
      className="border-b bg-background py-16 sm:py-20 lg:py-24"
      aria-labelledby="problem-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why Ariquo"
          title="Pet care today is fragmented"
          description="Owners juggle a dozen tools and never get the full picture. Ariquo brings it all together — without replacing the humans you already trust."
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {PROBLEM_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <motion.div key={card.title} variants={fadeUp}>
                <Card className="h-full gap-4 p-6 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-1 hover:ring-primary/20">
                  <CardHeader className="px-0">
                    <IconBadge>
                      <Icon className="size-5" />
                    </IconBadge>
                    <CardTitle className="mt-2 text-lg">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <p className="text-sm text-muted-foreground text-pretty">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Solution section
// ---------------------------------------------------------------------------

const SOLUTION_STEPS = [
  {
    icon: PawPrint,
    title: 'Pet Identity',
    description:
      'One persistent profile — species, breed, microchip, photo, allergies. Travels with the pet for life.',
  },
  {
    icon: ClipboardList,
    title: 'Health Timeline',
    description:
      'Vaccines, meds, weight, procedures, behaviour notes — a longitudinal record shared with chosen caregivers.',
  },
  {
    icon: Activity,
    title: 'AI Observation & Triage',
    description:
      'Describe a symptom, snap a photo. AI helps you read the signal and decide what to do next — calmly.',
  },
  {
    icon: Store,
    title: 'Connected Marketplace',
    description:
      'Vets, sitters, groomers, walkers, transport — verified providers, bookings and payments in one place.',
  },
] as const

function SolutionSection() {
  return (
    <section
      id="solution"
      className="border-b bg-muted/30 py-16 sm:py-20 lg:py-24"
      aria-labelledby="solution-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Ariquo way"
          title="Four layers, one operating system"
          description="A unified stack that turns scattered pet care into a single, continuous relationship."
        />
        <motion.ol
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-3"
        >
          {SOLUTION_STEPS.map((step, idx) => {
            const Icon = step.icon
            const isLast = idx === SOLUTION_STEPS.length - 1
            return (
              <motion.li key={step.title} variants={fadeUp} className="relative">
                <Card className="h-full gap-4 p-6 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-1 hover:ring-primary/20">
                  <div className="flex items-center justify-between">
                    <IconBadge>
                      <Icon className="size-5" />
                    </IconBadge>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Step {idx + 1}
                    </span>
                  </div>
                  <CardHeader className="px-0">
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <p className="text-sm text-muted-foreground text-pretty">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Arrow between tiles */}
                {!isLast ? (
                  <>
                    <ChevronRight
                      className="absolute -right-2 top-1/2 hidden size-5 -translate-y-1/2 text-primary/60 lg:block"
                      aria-hidden
                    />
                    <ArrowDown
                      className="mx-auto mt-1 size-5 text-primary/60 lg:hidden"
                      aria-hidden
                    />
                  </>
                ) : null}
              </motion.li>
            )
          })}
        </motion.ol>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// AI Modules section
// ---------------------------------------------------------------------------

type AiModule = {
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  section: AppSection
  kind: 'chat' | 'vision' | 'data'
}

const AI_MODULES: AiModule[] = [
  {
    name: 'Symptom AI',
    description: 'Describe what you see — get a calm, structured triage.',
    icon: Stethoscope,
    section: 'ai-triage',
    kind: 'chat',
  },
  {
    name: 'Skin Image AI',
    description: 'Photo of a rash, lump or coat change → first reading.',
    icon: ScanFace,
    section: 'ai-vision',
    kind: 'vision',
  },
  {
    name: 'Dental Image AI',
    description: 'Teeth & gums photo — plaque, tartar, red flags.',
    icon: Bone,
    section: 'ai-vision',
    kind: 'vision',
  },
  {
    name: 'Eye / Ear Image AI',
    description: 'Discharge, redness, swelling — visual screening.',
    icon: Eye,
    section: 'ai-vision',
    kind: 'vision',
  },
  {
    name: 'Gait & Mobility AI',
    description: 'Short clip → limp, stiffness, recovery signals.',
    icon: Footprints,
    section: 'ai-vision',
    kind: 'vision',
  },
  {
    name: 'Weight & Nutrition AI',
    description: 'BCS, ideal weight, daily calories, meal plan.',
    icon: Scale,
    section: 'ai-nutrition',
    kind: 'data',
  },
  {
    name: 'Behavior AI',
    description: 'Sudden barking, hiding, pacing — what it might mean.',
    icon: Brain,
    section: 'ai-behavior',
    kind: 'chat',
  },
  {
    name: 'Medication AI',
    description: 'Interactions, reminders, missed-dose guidance.',
    icon: Pill,
    section: 'preventive',
    kind: 'data',
  },
  {
    name: 'Preventive Care AI',
    description: 'Vaccine, deworming & check-up schedule by species.',
    icon: ShieldCheck,
    section: 'preventive',
    kind: 'data',
  },
  {
    name: 'Emergency Triage AI',
    description: 'Red-flag symptoms → when to go now, where to go.',
    icon: Siren,
    section: 'ai-triage',
    kind: 'chat',
  },
] as const

function AIModulesSection() {
  const enterApp = useApp((s) => s.enterApp)

  const handleTry = (m: AiModule) => {
    enterApp(m.section)
    toast('Opening AI module', {
      description: `${m.name} — observation, not a diagnosis.`,
    })
  }

  return (
    <section
      id="ai"
      className="border-b bg-background py-16 sm:py-20 lg:py-24"
      aria-labelledby="ai-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="AI core"
          title="Ten AI modules — built for pet owners"
          description="Each module is an assistant for one specific question. Together they form a calm, second-opinion layer over everyday pet care."
        />

        <div className="mb-6 flex justify-center">
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-amber-400/40 bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          >
            <TriangleAlert className="size-3.5" />
            AI assists — does not diagnose.
          </Badge>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {AI_MODULES.map((m) => {
            const Icon = m.icon
            return (
              <motion.div key={m.name} variants={fadeUp}>
                <Card className="h-full gap-4 p-5 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-1 hover:ring-primary/20">
                  <CardHeader className="px-0">
                    <IconBadge>
                      <Icon className="size-5" />
                    </IconBadge>
                    <CardTitle className="mt-2 text-base">{m.name}</CardTitle>
                    <CardDescription className="text-xs text-pretty">
                      {m.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 min-h-9 w-full"
                      onClick={() => handleTry(m)}
                    >
                      Try it
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Species scope
// ---------------------------------------------------------------------------

type Species = {
  name: string
  icon: React.ComponentType<{ className?: string }>
  status: 'mvp' | 'soon'
}

const SPECIES: Species[] = [
  { name: 'Dogs', icon: Dog, status: 'mvp' },
  { name: 'Cats', icon: Cat, status: 'mvp' },
  { name: 'Birds', icon: Bird, status: 'soon' },
  { name: 'Rabbits', icon: Rabbit, status: 'soon' },
  { name: 'Rodents', icon: Bug, status: 'soon' },
  { name: 'Reptiles', icon: Turtle, status: 'soon' },
  { name: 'Fish', icon: Fish, status: 'soon' },
] as const

function SpeciesSection() {
  return (
    <section
      id="species"
      className="border-b bg-muted/30 py-16 sm:py-20 lg:py-24"
      aria-labelledby="species-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Species scope"
          title="Built species-aware from day one"
          description="MVP launches for the animals most families care for. The architecture already understands the rest — they arrive as communities form."
        />
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-wrap justify-center gap-3"
        >
          {SPECIES.map((s) => {
            const Icon = s.icon
            const isMvp = s.status === 'mvp'
            return (
              <motion.li key={s.name} variants={fadeUp}>
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    isMvp
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  {s.name}
                  {isMvp ? (
                    <Badge className="ml-1 rounded-full bg-primary/15 text-primary">
                      MVP
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="ml-1 rounded-full bg-muted text-muted-foreground"
                    >
                      Coming soon
                    </Badge>
                  )}
                </span>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Marketplace section
// ---------------------------------------------------------------------------

type ServiceCat = {
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const SERVICE_CATEGORIES: ServiceCat[] = [
  { name: 'Veterinary', icon: Stethoscope, description: 'Clinics & tele-triage' },
  { name: 'Boarding', icon: Hotel, description: 'Stays when you travel' },
  { name: 'Sitting', icon: Home, description: 'In-home care' },
  { name: 'Walking', icon: Footprints, description: 'Verified walkers' },
  { name: 'Grooming', icon: Scissors, description: 'Coat, nails, hygiene' },
  { name: 'Training', icon: GraduationCap, description: 'Behaviour & skills' },
  { name: 'Transport', icon: Truck, description: 'Safe pet journeys' },
  { name: 'Commerce', icon: ShoppingBag, description: 'Food, meds, supplies' },
] as const

function MarketplaceSection() {
  const enterApp = useApp((s) => s.enterApp)
  return (
    <section
      id="marketplace"
      className="border-b bg-background py-16 sm:py-20 lg:py-24"
      aria-labelledby="marketplace-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Marketplace"
          title="Eight service categories, one trusted network"
          description="Verified providers, transparent pricing, in-app booking and payments — surfaced when your pet or AI flags the need."
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {SERVICE_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <motion.div key={cat.name} variants={fadeUp}>
                <Card className="h-full gap-3 p-5 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-1 hover:ring-primary/20">
                  <CardHeader className="px-0">
                    <IconBadge>
                      <Icon className="size-5" />
                    </IconBadge>
                    <CardTitle className="mt-2 text-base">{cat.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <p className="text-xs text-muted-foreground">
                      {cat.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            className="h-11 min-h-11"
            onClick={() => enterApp('marketplace')}
          >
            Browse the marketplace
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// B2B / Professional section
// ---------------------------------------------------------------------------

function ProfessionalSection() {
  const enterApp = useApp((s) => s.enterApp)
  const features = [
    {
      icon: BarChart3,
      title: 'Longitudinal trends',
      description: 'Weight, BCS, vitals, behaviour — across years and visits.',
    },
    {
      icon: Sparkles,
      title: 'AI-generated summaries',
      description: 'A one-paragraph patient brief before every consultation.',
    },
    {
      icon: Users,
      title: 'Multi-pet & multi-staff',
      description: 'Clinics, sitters, groomers — roles, teams, handovers.',
    },
    {
      icon: FileText,
      title: 'Records & API',
      description: 'Two-way sync with practice management systems.',
    },
  ] as const

  return (
    <section
      id="professional"
      className="border-b bg-muted/30 py-16 sm:py-20 lg:py-24"
      aria-labelledby="professional-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="flex flex-col gap-5"
          >
            <Badge
              variant="outline"
              className="w-fit gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-primary"
            >
              <Building2 className="size-3.5" />
              For veterinarians &amp; providers
            </Badge>
            <h2
              id="professional-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-balance"
            >
              A professional dashboard on top of the same pet OS
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground text-pretty">
              Vets, sitters, groomers and trainers get a calm workspace with the
              pet&apos;s full history, AI-generated summaries, and longitudinal
              trends — without replacing the tools they already use.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 min-h-11"
                onClick={() => enterApp('professional')}
              >
                Open the professional view
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 min-h-11"
                onClick={() =>
                  toast('Sales contact', {
                    description:
                      'A team member will reach out — pro tier includes API & SSO.',
                  })
                }
              >
                Contact sales
              </Button>
            </div>
          </motion.div>

          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid gap-4 sm:grid-cols-2"
          >
            {features.map((f) => {
              const Icon = f.icon
              return (
                <motion.li key={f.title} variants={fadeUp}>
                  <Card className="h-full gap-3 p-5 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-1 hover:ring-primary/20">
                    <CardHeader className="px-0">
                      <IconBadge>
                        <Icon className="size-5" />
                      </IconBadge>
                      <CardTitle className="mt-2 text-base">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                      <p className="text-xs text-muted-foreground text-pretty">
                        {f.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.li>
              )
            })}
          </motion.ul>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

type PricingTier = {
  name: string
  price: string
  cadence: string
  description: string
  features: string[]
  cta: string
  highlight: boolean
  onClick: () => void
}

function PricingSection() {
  const enterApp = useApp((s) => s.enterApp)

  const tiers: PricingTier[] = [
    {
      name: 'Free',
      price: '€0',
      cadence: 'forever',
      description: 'Pet identity and a clean, lifelong record.',
      features: [
        'Up to 2 pets',
        'Pet identity & photo',
        'Health timeline',
        'Vaccine & medication reminders',
        'Marketplace browsing',
      ],
      cta: 'Start free',
      highlight: false,
      onClick: () => enterApp('dashboard'),
    },
    {
      name: 'Premium',
      price: '€9',
      cadence: 'per month',
      description: 'AI triage, vision, behaviour and nutrition — for one household.',
      features: [
        'Everything in Free',
        'Unlimited pets',
        'Symptom & Emergency triage AI',
        'Skin, dental, eye/ear, gait vision AI',
        'Behaviour & nutrition AI',
        'Priority reminders & sync',
      ],
      cta: 'Open the demo',
      highlight: true,
      onClick: () => enterApp('ai-triage'),
    },
    {
      name: 'Pro / B2B',
      price: 'Custom',
      cadence: 'clinic plan',
      description: 'For veterinarians, sitters, groomers & multi-pet teams.',
      features: [
        'Everything in Premium',
        'Professional dashboards',
        'AI patient summaries',
        'Multi-staff & roles',
        'Records API & integrations',
        'Priority support',
      ],
      cta: 'Contact sales',
      highlight: false,
      onClick: () =>
        toast('Sales contact', {
          description:
            'Pro tier scales per clinic — reach out for a tailored plan in the €7–15/seat range.',
        }),
    },
  ]

  return (
    <section
      id="pricing"
      className="border-b bg-background py-16 sm:py-20 lg:py-24"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Free to start. €9/mo for the full AI layer."
          description="Lifetime identity is always free. AI triage, vision, behaviour and nutrition unlock with Premium — designed to fit the €7–15/month range proposed in the dossier."
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-5 lg:grid-cols-3"
        >
          {tiers.map((tier) => (
            <motion.div key={tier.name} variants={fadeUp}>
              <Card
                className={cn(
                  'relative h-full gap-5 p-6 transition-all',
                  tier.highlight
                    ? 'border-primary/40 shadow-lg ring-1 ring-primary/20'
                    : 'hover:-translate-y-1 hover:shadow-md hover:ring-1 hover:ring-primary/20',
                )}
              >
                {tier.highlight ? (
                  <Badge className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-primary-foreground shadow-sm">
                    Most popular
                  </Badge>
                ) : null}
                <CardHeader className="px-0">
                  <CardTitle className="text-base">{tier.name}</CardTitle>
                  <CardDescription className="text-sm text-pretty">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">
                      {tier.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{tier.cadence}
                    </span>
                  </div>
                  <ul className="mt-5 flex flex-col gap-2 text-sm">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="mt-2">
                  <Button
                    className="h-10 min-h-10 w-full"
                    variant={tier.highlight ? 'default' : 'outline'}
                    onClick={tier.onClick}
                  >
                    {tier.cta}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// CTA panel
// ---------------------------------------------------------------------------

function CTASection() {
  const enterApp = useApp((s) => s.enterApp)
  return (
    <section
      id="cta"
      className="border-b bg-background py-16 sm:py-20"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/15 to-primary/5 p-8 sm:p-12 lg:p-16"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 opacity-20">
            <PawPrint className="size-40 text-primary" />
          </div>
          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2
                id="cta-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-balance"
              >
                Give your pet a lifelong digital home.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground text-pretty">
                Open the demo, build a pet profile, try the AI — no signup
                required. Ariquo remembers everything so you don&apos;t have to.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 min-h-11"
                onClick={() => enterApp('dashboard')}
              >
                Open the app
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 min-h-11 bg-background/60"
                onClick={() => enterApp('ai-triage')}
              >
                Try AI triage
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

const FOOTER_COLUMNS: {
  title: string
  links: { label: string; href: string }[]
}[] = [
  {
    title: 'Product',
    links: [
      { label: 'Problem', href: '#problem' },
      { label: 'Solution', href: '#solution' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Species', href: '#species' },
    ],
  },
  {
    title: 'AI',
    links: [
      { label: 'Symptom AI', href: '#ai' },
      { label: 'Vision AI', href: '#ai' },
      { label: 'Nutrition AI', href: '#ai' },
      { label: 'Emergency triage', href: '#ai' },
    ],
  },
  {
    title: 'Marketplace',
    links: [
      { label: 'Veterinary', href: '#marketplace' },
      { label: 'Boarding & sitting', href: '#marketplace' },
      { label: 'Grooming', href: '#marketplace' },
      { label: 'Training', href: '#marketplace' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#top' },
      { label: 'For professionals', href: '#professional' },
      { label: 'Contact sales', href: '#pricing' },
      { label: 'Privacy', href: '#top' },
    ],
  },
]

function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-4">
            <BrandLogo />
            <p className="max-w-xs text-sm text-muted-foreground text-pretty">
              The operating system for animal life. Identity, record, AI and a
              connected marketplace — in one calm place.
            </p>
            <p className="text-xs text-muted-foreground italic">
              Ariquo is a working name — not a final brand.
            </p>
            <div className="mt-1">
              <ModeToggle />
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ariquo (working name). All rights
            reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            AI assists — does not diagnose. Always consult a veterinarian for
            medical decisions.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ---------------------------------------------------------------------------
// Root landing page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <AIModulesSection />
        <SpeciesSection />
        <MarketplaceSection />
        <ProfessionalSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
