import { lazy, Suspense } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { BookOpenText, LayoutPanelTop, MessageSquareText, Network } from 'lucide-react'
import { AutoWikiBrand } from './components/AutoWikiBrand.jsx'
import { Toaster } from './components/ui/sonner.jsx'

const Landing = lazy(() => import('./pages/Landing.jsx'))
const Home = lazy(() => import('./pages/Home.jsx'))
const Chat = lazy(() => import('./pages/Chat.jsx'))
const Wiki = lazy(() => import('./pages/Wiki.jsx'))
const SampleWiki = lazy(() => import('./pages/SampleWiki.jsx'))
const Architecture = lazy(() => import('./pages/Architecture.jsx'))

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
      <>
        <Suspense fallback={<p className="landing-loading" role="status">Loading AutoWiki…</p>}>
          <Landing />
        </Suspense>
        <Toaster richColors closeButton />
      </>
    )
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <AutoWikiBrand />
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
        <Suspense fallback={<p className="text-sm text-muted-foreground" role="status">Loading workspace…</p>}>
          <Routes>
            <Route path="/workspace" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/wiki" element={<Wiki />} />
            <Route path="/wiki/sample/:slug" element={<SampleWiki />} />
            <Route path="/architecture" element={<Architecture />} />
          </Routes>
        </Suspense>
      </main>
      <Toaster richColors closeButton />
    </>
  )
}
