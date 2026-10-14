import { AppBackground } from './AppBackground.jsx'
import { AppFooter } from './AppFooter.jsx'
import { AppNav } from './AppNav.jsx'
import { RouteViewport } from './RouteViewport.jsx'
import './shell.css'
import { lazy, Suspense, useEffect, useState } from 'react'
const offlineModule = import('./OfflineBanner.jsx')
const OfflineBanner = lazy(() => offlineModule)

/**
 * The shell every app route (Workspace, Chat, Wiki, Architecture) lives in: skip link, background layer, pill nav,
 * the page region, footer and toasts. The nav, background and footer persist across routes; only the page region
 * changes (RouteViewport).
 */
export function AppShell() {
  const [connection, setConnection] = useState(() => navigator.onLine ? '' : 'offline')
  const [noticeLoaded, setNoticeLoaded] = useState(() => !navigator.onLine)
  useEffect(() => {
    const offline = () => { setNoticeLoaded(true); setConnection('offline') }
    const network = () => { setNoticeLoaded(true); setConnection(navigator.onLine ? 'network' : 'offline') }
    const online = () => setConnection('')
    window.addEventListener('offline', offline); window.addEventListener('online', online); window.addEventListener('autowiki:network-error', network)
    return () => { window.removeEventListener('offline', offline); window.removeEventListener('online', online); window.removeEventListener('autowiki:network-error', network) }
  }, [])
  return (
    <div className="app-shell" data-route-ready="false">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <AppBackground />
      <AppNav />
      {noticeLoaded ? <Suspense fallback={null}><OfflineBanner reason={connection} onDismiss={() => setConnection('')} /></Suspense> : null}
      <main id="main-content" className="shell-main" tabIndex={-1}>
        <RouteViewport />
      </main>
      <AppFooter />
    </div>
  )
}
