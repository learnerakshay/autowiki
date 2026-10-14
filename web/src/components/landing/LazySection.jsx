import { Suspense, useEffect, useRef, useState } from 'react'
import { EffectsBoundary } from './EffectsBoundary.jsx'
import { LOAD_ALL_EVENT } from './loadAll.js'

const whenIdle = (callback, timeout = 1200) => {
  if ('requestIdleCallback' in window) return requestIdleCallback(callback, { timeout })
  return setTimeout(callback, 200)
}
const cancelIdle = (handle) => {
  if ('cancelIdleCallback' in window) cancelIdleCallback(handle)
  else clearTimeout(handle)
}

/**
 * Code-splits a below-the-fold section. The stable wrapper keeps its anchor id and an approximate
 * height, so the page doesn't jump; the section's chunk (and its ScrollTrigger/GSAP-heavy code) is
 * fetched when the wrapper nears the viewport and mounted on idle, or at once if it is actually
 * about to be seen. Nothing here is required for the hero to render.
 *
 * After the hero has settled, sections also mount one at a time during idle periods, in page order, so the
 * first scroll never pays for mounting them. Visiting a section earlier simply mounts it earlier.
 *
 * @param Section  a React.lazy component created at module level
 * @param preload  the same dynamic import, used to start the fetch early (the bundler dedupes it)
 */
export function LazySection({ id, Section, preload, minHeight, order = 0, rootMargin = '500px 0px' }) {
  const wrapperRef = useRef(null)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper || armed) return undefined
    let idleHandle = 0
    const arm = () => { preload(); setArmed(true) }
    window.addEventListener(LOAD_ALL_EVENT, arm)

    if (!('IntersectionObserver' in window)) {
      arm()
      return () => window.removeEventListener(LOAD_ALL_EVENT, arm)
    }
    // Approaching: fetch and mount when the main thread is quiet, so the hero's work always goes first.
    const near = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !idleHandle) idleHandle = whenIdle(arm) }, { rootMargin })
    // About to be seen: don't wait.
    const visible = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) arm() }, { rootMargin: '0px' })
    near.observe(wrapper)
    visible.observe(wrapper)
    // Background warm-up: well after load (Lighthouse and first interactions are over), staggered by order.
    let warmHandle = 0
    const warm = setTimeout(() => { warmHandle = whenIdle(arm, 3000) }, 5000 + order * 800)
    return () => {
      clearTimeout(warm)
      if (warmHandle) cancelIdle(warmHandle)
      near.disconnect()
      visible.disconnect()
      window.removeEventListener(LOAD_ALL_EVENT, arm)
      if (idleHandle) cancelIdle(idleHandle)
    }
  }, [armed, preload, order, rootMargin])

  return (
    <div ref={wrapperRef} id={id} className="lp-lazy" style={{ minHeight: armed ? undefined : minHeight }} data-lazy-section={id}>
      {armed ? (
        <EffectsBoundary>
          <Suspense fallback={<div style={{ minHeight }} aria-hidden="true" />}>
            <Section />
          </Suspense>
        </EffectsBoundary>
      ) : null}
    </div>
  )
}
