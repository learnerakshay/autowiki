import { lazy, Suspense } from 'react'
import { Toaster as KitToaster } from '../ui/kit/toast.jsx'
import { AppBackground } from './AppBackground.jsx'
import { AppFooter } from './AppFooter.jsx'
import { AppNav } from './AppNav.jsx'
import { RouteViewport } from './RouteViewport.jsx'
import './shell.css'

// The workspace jobs still raise toasts through sonner; it stays off the landing page's critical path and goes away
// when those pages move to the kit's toast() (see docs/design-system.md).
const LegacyToaster = lazy(() => import('../ui/sonner.jsx').then((module) => ({ default: module.Toaster })))

/**
 * The shell every app route (Workspace, Chat, Wiki, Architecture) lives in: skip link, background layer, pill nav,
 * the page region, footer and toasts. The nav, background and footer persist across routes; only the page region
 * changes (RouteViewport).
 */
export function AppShell() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <AppBackground />
      <AppNav />
      <main id="main-content" className="shell-main" tabIndex={-1}>
        <RouteViewport />
      </main>
      <AppFooter />
      <Suspense fallback={null}><LegacyToaster richColors closeButton /></Suspense>
      <KitToaster />
    </div>
  )
}
