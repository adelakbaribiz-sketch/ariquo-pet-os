'use client'

/**
 * Ariquo — root page.
 *
 * The / route hosts both the marketing landing experience and the in-app
 * dashboard. Switching is handled by client-side state (Zustand store
 * `useApp`). Both branches are lazy-loaded so the initial bundle stays small.
 */

import * as React from 'react'
import { useApp } from '@/lib/store'

const LandingPage = React.lazy(() =>
  import('@/components/landing/landing-page').then((m) => ({ default: m.default })),
)
const AppShell = React.lazy(() =>
  import('@/components/app-shell').then((m) => ({ default: m.AppShell })),
)

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-sm">Loading Ariquo…</p>
      </div>
    </div>
  )
}

export default function Home() {
  const view = useApp((s) => s.view)

  return (
    <React.Suspense fallback={<FullScreenLoader />}>
      {view === 'landing' ? <LandingPage /> : <AppShell />}
    </React.Suspense>
  )
}
