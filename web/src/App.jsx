import { lazy, Suspense } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { BookOpenText, Home as HomeIcon, MessageSquareText } from 'lucide-react'
import { Toaster } from './components/ui/sonner.jsx'
import Chat from './pages/Chat.jsx'
import Home from './pages/Home.jsx'

const Wiki = lazy(() => import('./pages/Wiki.jsx'))

const navigation = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/chat', label: 'Chat', icon: MessageSquareText },
  { to: '/wiki', label: 'Wiki', icon: BookOpenText },
]

export default function App() {
  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <NavLink to="/" className="brand" aria-label="AutoWiki home">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M6.5 3.75h7l4 4v12.5h-11z" />
                <path d="M13.5 3.75v4h4M9 9.5v5.25m0-2.75h3.25m0 0v3.25" />
                <circle cx="9" cy="8.75" r="1" />
                <circle cx="9" cy="15.5" r="1" />
                <circle cx="13" cy="15.5" r="1" />
              </svg>
            </span>
            <span>AutoWiki</span>
          </NavLink>
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
      <main className="app-main">
        <Suspense fallback={<p className="text-sm text-muted-foreground" role="status">Loading workspace…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/wiki" element={<Wiki />} />
          </Routes>
        </Suspense>
      </main>
      <Toaster richColors closeButton />
    </>
  )
}
