import { Toaster as KitToaster } from '../ui/kit/toast.jsx'
import { AppBackground } from './AppBackground.jsx'
import { AppFooter } from './AppFooter.jsx'
import { AppNav } from './AppNav.jsx'
import { RouteViewport } from './RouteViewport.jsx'
import './shell.css'

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
      <KitToaster />
    </div>
  )
}
