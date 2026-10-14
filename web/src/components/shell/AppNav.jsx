import { whenIdle, cancelIdle } from '../../lib/idle.js'
import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BrandLink } from '../brand/BrandLink.jsx'
import { actions, routes } from '../../data/landingCopy.js'
import { PillNav } from './PillNav.jsx'
import { activeNavIndex, appNav, appRoutes, loadRoute } from './routes.js'
import { useScrollProgress } from './useScrollProgress.js'
import { Button, Kbd } from '../ui/kit/index.js'
import { Search } from 'lucide-react'
import { openPalette, prefetchPalette } from '../../lib/palette.js'

// "Generate a Wiki" lands on the Workspace and focuses its repository field (the route transition honours this).
const generateState = { focus: '#repo' }

/** The app's nav: the landing's pill family, with the active pill following the route. */
export function AppNav() {
  const { pathname } = useLocation()
  const progressRef = useRef(null)
  const scrolled = useScrollProgress(progressRef, pathname)
  const onWorkspace = pathname === '/workspace'
  const items = appNav.map((item) => ({ ...item, onIntent: () => {
    const route = appRoutes.find((entry) => entry.key === item.key)
    if (route) void loadRoute(route)
  } }))

  useEffect(() => {
    const handle = whenIdle(() => {
      appRoutes.filter((route) => route.key !== 'sample' && route.path !== pathname).forEach((route) => void loadRoute(route))
    }, 3000, 1200)
    return () => cancelIdle(handle)
  }, [pathname])

  return (
    <PillNav
      variant="app"
      brand={<BrandLink />}
      items={items}
      activeIndex={activeNavIndex(pathname)}
      current="page"
      linksLabel="Main navigation"
      menuLabel="Menu"
      inertSelectors="#main-content, .app-footer"
      progressRef={progressRef}
      headerProps={{ 'data-scrolled': scrolled, 'data-past-hero': 'true', 'data-tone': 'light' }}
      cta={(
        <><Button variant="ghost" className="palette-trigger" aria-label="Open command palette" onClick={openPalette} onPointerEnter={() => void prefetchPalette().catch(() => {})} onFocus={() => void prefetchPalette().catch(() => {})}><Search aria-hidden="true" size={18} /><Kbd>Ctrl K</Kbd></Button>
        <Link to={routes.workspace} state={generateState} className="ln__primary" data-hidden={onWorkspace || undefined} inert={onWorkspace} onMouseEnter={() => void loadRoute(appRoutes[0])} onFocus={() => void loadRoute(appRoutes[0])}>
          {actions.primary} <ArrowRight aria-hidden="true" />
        </Link></>
      )}
      sheetActions={onWorkspace ? null : (
        <Link to={routes.workspace} state={generateState} className="ln__primary ln__primary--sheet">{actions.primary} <ArrowRight aria-hidden="true" /></Link>
      )}
    />
  )
}
