import { lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'

// The app shell (nav, background, page region, footer) is its own chunk, so the landing page doesn't pay for it.
const AppShell = lazy(() => import('./components/shell/AppShell.jsx').then((module) => ({ default: module.AppShell })))
// Dev-only surfaces: `import.meta.env.DEV` is a build-time constant, so production bundles never contain them.
const BrandBoard = import.meta.env.DEV ? lazy(() => import('./pages/dev/BrandBoard.jsx')) : null
const UiGallery = import.meta.env.DEV ? lazy(() => import('./pages/dev/UiGallery.jsx')) : null

export default function App() {
  const { pathname } = useLocation()

  if (pathname === '/') return <Landing />
  if (BrandBoard && pathname === '/dev/brand') return <Suspense fallback={null}><BrandBoard /></Suspense>
  if (UiGallery && pathname === '/dev/ui') return <Suspense fallback={null}><UiGallery /></Suspense>

  return <Suspense fallback={<div className="shell-boot" aria-hidden="true" />}><AppShell /></Suspense>
}
