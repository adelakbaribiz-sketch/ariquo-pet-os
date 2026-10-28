'use client'

/**
 * Ariquo — root page.
 *
 * The / route hosts both the marketing landing experience and the in-app
 * dashboard. Switching is handled by client-side state (Zustand store
 * `useApp`). Both branches are lazy-loaded so the initial bundle stays small.
 */

import * as React from 'react'
import { applyHash, stateToHash, useApp } from '@/lib/store'

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

/** Two-way sync between the navigation store and `location.hash`. */
function useHashRouting() {
  React.useEffect(() => {
    applyHash(window.location.hash)
    const onPop = () => applyHash(window.location.hash)
    window.addEventListener('hashchange', onPop)
    window.addEventListener('popstate', onPop)

    const unsub = useApp.subscribe((s, prev) => {
      if (s.view === prev.view && s.section === prev.section && s.activePetId === prev.activePetId) return
      const next = stateToHash(s)
      if (next !== window.location.hash) {
        const url = next || window.location.pathname + window.location.search
        window.history.pushState(null, '', url)
      }
      if (s.view !== prev.view || s.section !== prev.section) window.scrollTo({ top: 0 })
    })
    return () => {
      unsub()
      window.removeEventListener('hashchange', onPop)
      window.removeEventListener('popstate', onPop)
    }
  }, [])
}

export default function Home() {
  const view = useApp((s) => s.view)
  useHashRouting()

  return (
    <React.Suspense fallback={<FullScreenLoader />}>
      {view === 'landing' ? <LandingPage /> : <AppShell />}
    </React.Suspense>
  )
}
