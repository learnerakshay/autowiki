import { useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BrandLink } from '../brand/BrandLink.jsx'
import { actions, routes } from '../../data/landingCopy.js'
import { PillNav } from './PillNav.jsx'
import { activeNavIndex, appNav } from './routes.js'
import { useScrollProgress } from './useScrollProgress.js'

// "Generate a Wiki" lands on the Workspace and focuses its repository field (the route transition honours this).
const generateState = { focus: '#repo' }

/** The app's nav: the landing's pill family, with the active pill following the route. */
export function AppNav() {
  const { pathname } = useLocation()
  const progressRef = useRef(null)
  const scrolled = useScrollProgress(progressRef, pathname)
  const onWorkspace = pathname === '/workspace'

  return (
    <PillNav
      variant="app"
      brand={<BrandLink />}
      items={appNav}
      activeIndex={activeNavIndex(pathname)}
      current="page"
      linksLabel="Main navigation"
      menuLabel="Menu"
      inertSelectors="#main-content, .app-footer"
      progressRef={progressRef}
      headerProps={{ 'data-scrolled': scrolled, 'data-past-hero': 'true', 'data-tone': 'light' }}
      cta={(
        <Link to={routes.workspace} state={generateState} className="ln__primary" data-hidden={onWorkspace || undefined} inert={onWorkspace}>
          {actions.primary} <ArrowRight aria-hidden="true" />
        </Link>
      )}
      sheetActions={onWorkspace ? null : (
        <Link to={routes.workspace} state={generateState} className="ln__primary ln__primary--sheet">{actions.primary} <ArrowRight aria-hidden="true" /></Link>
      )}
    />
  )
}
