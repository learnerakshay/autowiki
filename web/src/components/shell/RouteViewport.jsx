import { createElement, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Route, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { brand } from '../../config/brand.js'
import { subscribeMotion, prefersReducedMotion, reduced, springCss, springDuration } from '../../lib/motion.js'
import { Logo } from '../brand/Logo.jsx'
import { appRoutes, loadRoute, loadedPage, routeFor } from './routes.js'
import './route-viewport.css'
import { ErrorBoundary, ChunkError } from './ErrorBoundary.jsx'
import { RouteSkeleton } from './RouteSkeleton.jsx'
import { scrollPositions, routeTitles } from '../../lib/navigation.js'

const LOADER_DELAY = 150 // the breathing mark only appears if a page takes longer than this, so quick loads never flash it
const FADE_OUT_MS = 90

function RoutePage({ routeKey }) {
  const location = useLocation()
  const Page = loadedPage(routeKey)
  if (!Page) {
    return <ChunkError />
  }
  return <ErrorBoundary resetKey={location.key}>{createElement(Page)}</ErrorBoundary>
}

const spring = () => ({ duration: springDuration.default * 1000, easing: springCss.default, fill: 'backwards' })

/** The new page rises 12px and fades in on the shared spring; under reduced motion it is a 0.18s cross-fade. */
function playEnter(region, reducedMotion) {
  if (!region) return
  if (reducedMotion) { region.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced.fade * 1000, easing: 'ease-out' }); return }
  region.animate([{ opacity: 0, transform: 'translate3d(0, 12px, 0)' }, { opacity: 1, transform: 'none' }], spring())
}

/** A short stagger: the page heading follows the page by 70ms. */
function playHeading(region) {
  region?.querySelector('h1')?.animate([{ opacity: 0, transform: 'translate3d(0, 10px, 0)' }, { opacity: 1, transform: 'none' }], { ...spring(), delay: 70 })
}

function restoreScroll(target, navigationType, saved) {
  if (navigationType === 'POP' && saved.has(target.key)) {
    window.scrollTo({ top: saved.get(target.key), left: 0, behavior: 'instant' })
    if (target.hash) {
      const anchor = document.getElementById(decodeURIComponent(target.hash.slice(1)))
      const heading = anchor?.matches('h1,h2,h3,h4,h5,h6') ? anchor : anchor?.querySelector('h1,h2,h3,h4,h5,h6')
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
    }
    return
  }
  const id = target.hash ? decodeURIComponent(target.hash.slice(1)) : ''
  const anchor = id ? document.getElementById(id) : null
  if (anchor) {
    anchor.scrollIntoView({ behavior: 'instant' })
    const heading = anchor.matches('h1,h2,h3,h4,h5,h6') ? anchor : anchor.querySelector('h1,h2,h3,h4,h5,h6') || anchor
    heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); return
  }
  window.scrollTo({ top: navigationType === 'POP' ? (saved.get(target.key) ?? 0) : 0, left: 0, behavior: 'instant' })
}

/** Moves focus to what the navigation asked for, else the page's h1. */
function focusPage(region, target) {
  const wanted = target.state?.focus && region?.querySelector(target.state.focus)
  const element = wanted || region?.querySelector('h1') || document.getElementById('main-content')
  if (element && !element.matches('input, textarea, select, button, a[href], [tabindex]')) element.setAttribute('tabindex', '-1')
  element?.focus({ preventScroll: true })
}

/**
 * The page region of the app shell. The nav, background and footer persist; only this region changes route.
 *
 *  - The next page's chunk loads while the current page stays interactive. A navigation made meanwhile supersedes it.
 *  - The swap is a short fade-out then a spring rise (Web Animations, on the shared spring); reduced motion is a 0.18s
 *    cross-fade. It never blocks input: the View Transitions API was measured and rejected, because Chrome drops
 *    clicks for ~450ms while one runs (see docs/design-system.md).
 *  - New routes scroll to the top, back/forward restore the saved position, a #hash scrolls to its element.
 *  - Focus moves to the new page's h1 (or the element the navigation asked for) and the title is announced politely.
 */
export function RouteViewport() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [shown, setShown] = useState(null)
  const [loading, setLoading] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const regionRef = useRef(null)
  const shownRef = useRef(null)
  const token = useRef(0)
  const fade = useRef(null)
  const scrollAt = useRef(scrollPositions)

  useEffect(() => subscribeMotion(() => {
    if (prefersReducedMotion()) {
      regionRef.current?.getAnimations({ subtree: true }).forEach((animation) => { try { animation.finish() } catch { animation.cancel() } })
      playEnter(regionRef.current, true)
    }
  }), [])

  useEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => { window.history.scrollRestoration = previous; token.current = -1 }
  }, [])

  useEffect(() => {
    // Every location change invalidates any swap still in flight (so A -> B -> A can't land on B).
    const mine = ++token.current
    fade.current?.cancel()
    const current = shownRef.current
    if (current && current.location.pathname === location.pathname) {
      // Same page (query / state change, or back to the page that is still showing): nothing to swap.
      queueMicrotask(() => setLoading(false))
      if (location.hash || navigationType === 'POP') restoreScroll(location, navigationType, scrollAt.current)
      return undefined
    }
    const target = location
    const type = navigationType
    const route = routeFor(target.pathname)
    const timer = window.setTimeout(() => { if (token.current === mine) setLoading(true) }, LOADER_DELAY)

    const run = async () => {
      try { if (route) await loadRoute(route) } catch { /* the page renders its own "could not be loaded" notice */ }
      window.clearTimeout(timer)
      if (token.current !== mine) return

      const region = regionRef.current
      const departing = shownRef.current
      if (departing) scrollAt.current.set(departing.location.key, window.scrollY)
      const reducedMotion = prefersReducedMotion()

      const apply = (moveFocus) => {
        document.querySelector('.app-shell')?.setAttribute('data-route-ready', 'true')
        flushSync(() => { setShown({ location: target, route }); setLoading(false) })
        shownRef.current = { location: target, route }
        restoreScroll(target, type, scrollAt.current)
        // The first render of the shell is a page load, not a route change: leave focus at the start of the document so
        // the skip link stays the first tab stop.
        const heading = region?.querySelector('h1')
        const title = routeTitles[route?.key] || (heading?.getAttribute('aria-label') || heading?.textContent || '').trim()
        if (moveFocus && !target.hash) focusPage(region, target)
        if (title) document.title = `${title} — ${brand.name}`
        setAnnouncement(title ? `${heading?.textContent.trim() || title}, ${brand.name}` : '')
      }

      if (!departing) { apply(false); return }

      if (!reducedMotion && region) {
        fade.current = region.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_OUT_MS, easing: 'ease-in', fill: 'forwards' })
        await fade.current.finished.catch(() => {})
        if (token.current !== mine) return
      }
      apply(true)
      fade.current?.cancel()
      playEnter(region, reducedMotion)
      if (!reducedMotion) playHeading(region)
    }
    run()
    return () => window.clearTimeout(timer)
  }, [location, navigationType])

  // Same page, new query / state / hash: render the live location without a transition.
  const renderLocation = shown && shown.location.pathname === location.pathname ? location : shown?.location
  const route = shown?.route

  return (
    <>
      <div ref={regionRef} className="route-viewport" data-route={route?.key} data-ready={shown ? 'true' : 'false'}>
        {shown ? (
          <div className={route?.track === 'full' || !route ? 'route-track route-track--full' : `route-track ui-container ui-container--${route.track}`}>
            <Routes location={renderLocation}>
              {appRoutes.map(({ key, path }) => <Route key={key} path={path} element={<RoutePage routeKey={key} />} />)}
            </Routes>
          </div>
        ) : <RouteSkeleton route={routeFor(location.pathname)?.key} search={location.search} />}
      </div>
      {loading ? (
        <p className="route-loader" role="status">
          <Logo variant="mark" size="1.25rem" decorative loading />
          Loading {(routeTitles[routeFor(location.pathname)?.key] || 'page').toLowerCase()}…
        </p>
      ) : null}
      <p className="ui-sr-only" role="status" aria-live="polite">{announcement}</p>
    </>
  )
}
