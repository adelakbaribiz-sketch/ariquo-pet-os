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
  Eye,
  Home as HomeIcon,
  LayoutDashboard,
  type LucideIcon,
  Menu,
  Moon,
  PawPrint,
  ScanSearch,
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
const LandingPage = React.lazy(() =>
  import('@/components/landing/landing-page').then((m) => ({ default: m.default })),
)
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

  { section: 'professional', label: 'Professional View', icon: Briefcase, group: 'Professional' },
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
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <PawPrint className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="text-base font-semibold tracking-tight">Ariquo</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
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
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted) {
    return <div className="h-9 w-9" aria-hidden />
  }
  const isDark = theme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="h-9 w-9"
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

  const handle = (s: AppSection) => {
    setSection(s)
    onNavigate?.()
  }

  return (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Primary">
      <div className="px-2 py-3">
        <BrandMark />
      </div>

      <div className="flex-1 overflow-y-auto scroll-area-thin pr-1">
        {(Object.keys(groups) as NavItem['group'][]).map((group) => {
          const items = groups[group]
          if (!items.length) return null
          return (
            <div key={group} className="mb-3">
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </div>
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon
                  const active = section === item.section
                  return (
                    <li key={item.section}>
                      <button
                        type="button"
                        onClick={() => handle(item.section)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          'min-h-[44px] text-left',
                          active
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="mt-auto border-t pt-3">
        <div className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://i.pravatar.cc/150?img=47" alt="Sara Ahmadi" />
            <AvatarFallback>SA</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">Sara Ahmadi</div>
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
  const exitToLanding = useApp((s) => s.exitToLanding)
  const setSection = useApp((s) => s.setSection)
  const section = useApp((s) => s.section)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const title = React.useMemo(() => {
    const item = NAV.find((n) => n.section === section)
    return item?.label ?? 'Ariquo'
  }, [section])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Ariquo navigation</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={exitToLanding}
          className="gap-1.5 text-muted-foreground"
        >
          <PawPrint className="h-4 w-4" />
          <span className="hidden sm:inline">Back to site</span>
        </Button>
      </div>

      <div className="ml-2 hidden items-center gap-2 text-sm text-muted-foreground md:flex">
        <span aria-hidden>·</span>
        <span className="font-medium text-foreground">{title}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => setSection('ai-triage')}
        >
          <Activity className="mr-1.5 h-4 w-4" />
          Quick triage
        </Button>
        <Button
          variant="default"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => setSection('pets')}
        >
          <PawPrint className="mr-1.5 h-4 w-4" />
          My pets
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

  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 border-r bg-sidebar/60 md:block">
            <SidebarContent />
          </aside>

          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="flex-1 overflow-y-auto">
              <React.Suspense
                fallback={
                  <div className="grid h-full place-items-center p-8">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
                      <p className="text-sm">Loading…</p>
                    </div>
                  </div>
                }
              >
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8"
                >
                  <SectionView section={section} />
                </motion.div>
              </React.Suspense>
            </main>
          </div>
        </div>

        {/* Sticky-to-bottom footer (natural push when content overflows) */}
        <footer className="border-t bg-background">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:px-8">
            <div className="flex items-center gap-2">
              <PawPrint className="h-3.5 w-3.5" />
              <span>
                <strong className="font-semibold text-foreground">Ariquo</strong> · Pet/Animal
                Operating System
              </span>
            </div>
            <p className="max-w-xl leading-relaxed">
              AI provides observation &amp; screening only — not a definitive veterinary
              diagnosis. Working name — not a final brand.
            </p>
          </div>
        </footer>
      </div>
    </QueryProvider>
  )
}
