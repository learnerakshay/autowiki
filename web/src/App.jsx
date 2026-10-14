import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import { ErrorBoundary } from './components/shell/ErrorBoundary.jsx'
import { PaletteController } from './components/shell/PaletteController.jsx'
import { scrollPositions } from './lib/navigation.js'

// The app shell (nav, background, page region, footer) is its own chunk, so the landing page doesn't pay for it.
const AppShell = lazy(() => import('./components/shell/AppShell.jsx').then((module) => ({ default: module.AppShell })))
// Dev-only surfaces: `import.meta.env.DEV` is a build-time constant, so production bundles never contain them.
const BrandBoard = import.meta.env.DEV ? lazy(() => import('./pages/dev/BrandBoard.jsx')) : null
const UiGallery = import.meta.env.DEV ? lazy(() => import('./pages/dev/UiGallery.jsx')) : null

export default function App() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const first = useRef(true)
  const [announcement, setAnnouncement] = useState('')
  useLayoutEffect(() => {
    if (location.pathname === '/' && !first.current) {
      document.title = 'Landing — AutoWiki'
      window.scrollTo({ top: navigationType === 'POP' ? scrollPositions.get(location.key) || 0 : 0, behavior: 'instant' })
      const heading = document.querySelector('h1')
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
      setAnnouncement('Landing, AutoWiki')
    } else setAnnouncement('')
    first.current = false
    return () => scrollPositions.set(location.key, window.scrollY)
  }, [location.key, location.pathname, navigationType])
  return <ErrorBoundary resetKey={location.pathname} root><AppContent /><PaletteController /><p className="sr-only" role="status">{announcement}</p></ErrorBoundary>
}

function AppContent() {
  const { pathname } = useLocation()

  if (pathname === '/') return <Landing />
  if (BrandBoard && pathname === '/dev/brand') return <Suspense fallback={null}><BrandBoard /></Suspense>
  if (UiGallery && pathname === '/dev/ui') return <Suspense fallback={null}><UiGallery /></Suspense>

  return <Suspense fallback={<div className="shell-boot" aria-hidden="true" />}><AppShell /></Suspense>
}
