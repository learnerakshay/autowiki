import { lazy, Suspense } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { BookOpenText, LayoutPanelTop, MessageSquareText } from 'lucide-react'
import { AutoWikiBrand } from './components/AutoWikiBrand.jsx'
import { Toaster } from './components/ui/sonner.jsx'
import Chat from './pages/Chat.jsx'
import Home from './pages/Home.jsx'

const Landing = lazy(() => import('./pages/Landing.jsx'))
const Wiki = lazy(() => import('./pages/Wiki.jsx'))

const navigation = [
  { to: '/workspace', label: 'Workspace', icon: LayoutPanelTop },
  { to: '/chat', label: 'Chat', icon: MessageSquareText },
  { to: '/wiki', label: 'Wiki', icon: BookOpenText },
]

export default function App() {
  const { pathname } = useLocation()

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
      <main className={pathname === '/workspace' ? 'app-main app-main--workspace' : 'app-main'}>
        <Suspense fallback={<p className="text-sm text-muted-foreground" role="status">Loading workspace…</p>}>
          <Routes>
            <Route path="/workspace" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/wiki" element={<Wiki />} />
          </Routes>
        </Suspense>
      </main>
      <Toaster richColors closeButton />
    </>
  )
}
