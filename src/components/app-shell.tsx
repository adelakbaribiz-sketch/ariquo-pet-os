'use client'

/**
 * Ariquo — App Shell
 *
 * Renders when `useApp(s => s.view) === 'app'`.
 * Provides the persistent left sidebar (collapsible on mobile), top bar,
 * main content area (switched on `section`), and sticky footer.
 *
 * The whole shell is wrapped in <QueryProvider> from the dashboard subagent
 * so dashboard hooks can fetch from /api/*. The AI/marketplace/professional
 * views additionally self-wrap in their own QueryClientProvider — that's fine,
 * nested providers take the inner one for their subtree.
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Apple,
  Brain,
  Briefcase,
  CalendarCheck,
  ChevronRight,
  Eye,
  Home as HomeIcon,
  LayoutDashboard,
  type LucideIcon,
  Menu,
  Moon,
  PawPrint,
  ScanSearch,
  ShieldCheck,
  Search,
  Store,
  Stethoscope,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useApp, type AppSection } from '@/lib/store'
import { QueryProvider } from '@/components/query-provider'

// Lazy-load section components so the initial bundle stays small and
// Turbopack can code-split per view.
const DashboardHome = React.lazy(() =>
  import('@/components/dashboard/dashboard-home').then((m) => ({ default: m.DashboardHome })),
)
const PetList = React.lazy(() =>
  import('@/components/dashboard/pet-list').then((m) => ({ default: m.PetList })),
)
const PetDetail = React.lazy(() =>
  import('@/components/dashboard/pet-detail').then((m) => ({ default: m.PetDetail })),
)
const PreventiveCare = React.lazy(() =>
  import('@/components/dashboard/preventive-care').then((m) => ({ default: m.PreventiveCare })),
)
const LostPet = React.lazy(() =>
  import('@/components/dashboard/lost-pet').then((m) => ({ default: m.LostPet })),
)
const AiTriage = React.lazy(() =>
  import('@/components/ai/ai-triage').then((m) => ({ default: m.AiTriage })),
)
const AiVision = React.lazy(() =>
  import('@/components/ai/ai-vision').then((m) => ({ default: m.AiVision })),
)
const AiNutrition = React.lazy(() =>
  import('@/components/ai/ai-nutrition').then((m) => ({ default: m.AiNutrition })),
)
const AiBehavior = React.lazy(() =>
  import('@/components/ai/ai-behavior').then((m) => ({ default: m.AiBehavior })),
)
const Marketplace = React.lazy(() =>
  import('@/components/marketplace/marketplace').then((m) => ({ default: m.Marketplace })),
)
const ProfessionalDashboard = React.lazy(() =>
  import('@/components/professional/professional-dashboard').then((m) => ({
    default: m.ProfessionalDashboard,
  })),
)

// ─────────────────────────────────────────────
//  Nav config
// ─────────────────────────────────────────────

interface NavItem {
  section: AppSection
  label: string
  icon: LucideIcon
  group: 'Overview' | 'AI Tools' | 'Services' | 'Professional'
  badge?: string
}

const NAV: NavItem[] = [
  { section: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { section: 'pets', label: 'My Pets', icon: PawPrint, group: 'Overview' },
  { section: 'pet-detail', label: 'Pet Profile', icon: HomeIcon, group: 'Overview' },
  { section: 'preventive', label: 'Preventive Care', icon: CalendarCheck, group: 'Overview' },
  { section: 'lost-pet', label: 'Lost Pet', icon: Search, group: 'Overview' },

  { section: 'ai-triage', label: 'AI Symptom Triage', icon: Stethoscope, group: 'AI Tools' },
  { section: 'ai-vision', label: 'Vision AI', icon: ScanSearch, group: 'AI Tools' },
  { section: 'ai-nutrition', label: 'Nutrition AI', icon: Apple, group: 'AI Tools' },
  { section: 'ai-behavior', label: 'Behavior AI', icon: Brain, group: 'AI Tools' },

  { section: 'marketplace', label: 'Marketplace', icon: Store, group: 'Services' },

  { section: 'professional', label: 'Clinic Workspace', icon: Briefcase, group: 'Professional', badge: 'B2B' },
]

// "pet-detail" is only meaningful with an active pet, so we don't show it
// as a primary nav item — it's opened from pet cards.
const PRIMARY_NAV = NAV.filter((n) => n.section !== 'pet-detail')

// ─────────────────────────────────────────────
//  Section renderer
// ─────────────────────────────────────────────

function SectionView({ section }: { section: AppSection }) {
  switch (section) {
    case 'dashboard':
      return <DashboardHome />
    case 'pets':
      return <PetList />
    case 'pet-detail':
      return <PetDetail />
    case 'preventive':
      return <PreventiveCare />
    case 'lost-pet':
      return <LostPet />
    case 'ai-triage':
      return <AiTriage />
    case 'ai-vision':
      return <AiVision />
    case 'ai-nutrition':
      return <AiNutrition />
    case 'ai-behavior':
      return <AiBehavior />
    case 'marketplace':
      return <Marketplace />
    case 'professional':
      return <ProfessionalDashboard />
    default:
      return <DashboardHome />
  }
}

// ─────────────────────────────────────────────
//  Brand mark
// ─────────────────────────────────────────────

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.42_0.09_175)] text-primary-foreground shadow-soft ring-1 ring-black/5">
        <PawPrint className="h-[18px] w-[18px]" />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[17px] font-semibold tracking-tight">Ariquo</div>
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Pet OS
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
//  Theme toggle
// ─────────────────────────────────────────────

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted) {
    return <div className="h-9 w-9" aria-hidden />
  }
  const isDark = resolvedTheme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

// ─────────────────────────────────────────────
//  Sidebar content (shared between desktop and mobile sheet)
// ─────────────────────────────────────────────

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const section = useApp((s) => s.section)
  const setSection = useApp((s) => s.setSection)
  const exitToLanding = useApp((s) => s.exitToLanding)

  const groups = React.useMemo(() => {
    const map: Record<NavItem['group'], NavItem[]> = {
      Overview: [],
      'AI Tools': [],
      Services: [],
      Professional: [],
    }
    for (const item of PRIMARY_NAV) map[item.group].push(item)
    return map
  }, [])

  // Pet profile lives under "My Pets" in the nav.
  const activeSection = section === 'pet-detail' ? 'pets' : section

  const handle = (s: AppSection) => {
    setSection(s)
    onNavigate?.()
  }

  return (
    <nav className="flex h-full flex-col p-3" aria-label="Primary">
      <button
        type="button"
        onClick={() => {
          exitToLanding()
          onNavigate?.()
        }}
        className="mb-2 rounded-xl px-2 py-3 text-left transition-colors hover:bg-sidebar-accent/60"
        aria-label="Ariquo — back to website"
      >
        <BrandMark />
      </button>

      <div className="scroll-area-thin -mr-1 flex-1 overflow-y-auto pr-1">
        {(Object.keys(groups) as NavItem['group'][]).map((group) => {
          const items = groups[group]
          if (!items.length) return null
          return (
            <div key={group} className="mb-4">
              <div className="px-3 pb-1.5 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
                {group}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon
                  const active = activeSection === item.section
                  return (
                    <li key={item.section}>
                      <button
                        type="button"
                        onClick={() => handle(item.section)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
                          'min-h-[40px] text-left',
                          active
                            ? 'bg-card text-foreground shadow-soft ring-1 ring-border'
                            : 'text-foreground/70 hover:bg-sidebar-accent hover:text-foreground',
                        )}
                      >
                        {active && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                          />
                        )}
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="mt-3 space-y-3">
        <div className="rounded-xl border bg-gradient-to-br from-primary/[0.07] to-accent/60 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Observation, not diagnosis
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            AI screens and triages. Your veterinarian decides.
          </p>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <Avatar className="h-8 w-8 ring-2 ring-card">
            <AvatarImage src="https://i.pravatar.cc/150?img=47" alt="Sara Ahmadi" />
            <AvatarFallback>SA</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">Sara Ahmadi</div>
            <div className="truncate text-[11px] text-muted-foreground">Berlin · Demo owner</div>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────
//  Top bar (mobile + desktop)
// ─────────────────────────────────────────────

function TopBar() {
  const setSection = useApp((s) => s.setSection)
  const section = useApp((s) => s.section)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const item = React.useMemo(() => NAV.find((n) => n.section === section), [section])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-xl md:px-6 lg:px-8">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="-ml-1 md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Ariquo navigation</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="md:hidden">
        <BrandMark compact />
      </div>

      <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm md:flex">
        <span className="text-muted-foreground">{item?.group ?? 'Overview'}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span className="font-medium text-foreground">{item?.label ?? 'Ariquo'}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden h-9 gap-1.5 rounded-full border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 sm:inline-flex"
          onClick={() => setSection('ai-triage')}
        >
          <Activity className="h-4 w-4" />
          Quick triage
        </Button>
        <Button
          variant="default"
          size="sm"
          className="hidden h-9 gap-1.5 rounded-full sm:inline-flex"
          onClick={() => setSection('marketplace')}
        >
          <Store className="h-4 w-4" />
          Book care
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground sm:hidden"
          aria-label="Quick triage"
          onClick={() => setSection('ai-triage')}
        >
          <Activity className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────
//  AppShell
// ─────────────────────────────────────────────

export function AppShell() {
  const section = useApp((s) => s.section)
  const activePetId = useApp((s) => s.activePetId)

  return (
    <QueryProvider>
      <div className="flex min-h-dvh bg-background">
        {/* Desktop sidebar — stays put while the content scrolls */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-sidebar md:block">
          <SidebarContent />
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1">
            <React.Suspense
              fallback={
                <div className="grid min-h-[60vh] place-items-center p-8">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
                    <p className="text-sm">Loading…</p>
                  </div>
                </div>
              }
            >
              <motion.div
                key={`${section}:${activePetId ?? ''}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-8"
              >
                <SectionView section={section} />
              </motion.div>
            </React.Suspense>
          </main>

          <footer className="border-t">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <PawPrint className="h-3.5 w-3.5" />
                <span>
                  <strong className="font-semibold text-foreground">Ariquo</strong> · Pet
                  Operating System · Prototype
                </span>
              </div>
              <p className="max-w-xl leading-relaxed">
                AI provides observation &amp; screening only — not a definitive veterinary
                diagnosis. &ldquo;Ariquo&rdquo; is a working name.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </QueryProvider>
  )
}
