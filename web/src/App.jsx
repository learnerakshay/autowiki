import { lazy, Suspense } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { BookOpenText, LayoutPanelTop, MessageSquareText, Network } from 'lucide-react'
import { BrandLink } from './components/brand/BrandLink.jsx'
import { Logo } from './components/brand/Logo.jsx'
import Landing from './pages/Landing.jsx'

// Toasts only exist for the workspace jobs, so the toaster stays off the landing page's critical path.
const Toaster = lazy(() => import('./components/ui/sonner.jsx').then((module) => ({ default: module.Toaster })))
const Home = lazy(() => import('./pages/Home.jsx'))
const Chat = lazy(() => import('./pages/Chat.jsx'))
const Wiki = lazy(() => import('./pages/Wiki.jsx'))
const SampleWiki = lazy(() => import('./pages/SampleWiki.jsx'))
const Architecture = lazy(() => import('./pages/Architecture.jsx'))
// Dev-only brand board: `import.meta.env.DEV` is a build-time constant, so production bundles never contain it.
const BrandBoard = import.meta.env.DEV ? lazy(() => import('./pages/dev/BrandBoard.jsx')) : null

const navigation = [
  { to: '/workspace', label: 'Workspace', icon: LayoutPanelTop },
  { to: '/chat', label: 'Chat', icon: MessageSquareText },
  { to: '/wiki', label: 'Wiki', icon: BookOpenText },
  { to: '/architecture', label: 'Architecture', icon: Network },
]

export default function App() {
  const { pathname } = useLocation()
  const mainClassName = pathname === '/workspace'
    ? 'app-main app-main--workspace'
    : pathname.startsWith('/wiki') || pathname === '/architecture'
      ? 'app-main app-main--wiki'
      : 'app-main'

  if (pathname === '/') {
    return (
      <Landing />
    )
  }

  if (BrandBoard && pathname === '/dev/brand') {
    return <Suspense fallback={null}><BrandBoard /></Suspense>
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <BrandLink />
          <nav className="app-nav" aria-label="Main navigation">
            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className={mainClassName}>
        <Suspense fallback={<p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Logo variant="mark" size="1.25rem" decorative loading /> Loading workspace…</p>}>
          <Routes>
            <Route path="/workspace" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/wiki" element={<Wiki />} />
            <Route path="/wiki/sample/:slug" element={<SampleWiki />} />
            <Route path="/architecture" element={<Architecture />} />
          </Routes>
        </Suspense>
      </main>
      <Suspense fallback={null}><Toaster richColors closeButton /></Suspense>
    </>
  )
}
