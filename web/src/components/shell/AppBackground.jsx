import { useEffect, useRef } from 'react'
import './app-background.css'

/**
 * One fixed, decorative layer behind every app page: a quieter version of the hero's mesh, grid and grain.
 * It is aria-hidden and pointer-events: none, uses no backdrop-filter, pauses its drift while the tab is hidden,
 * and is static under reduced motion. Intensity is set by --bg-mesh / --bg-grid / --bg-grain (tokens.css).
 */
export function AppBackground() {
  const ref = useRef(null)

  useEffect(() => {
    const layer = ref.current
    if (!layer) return undefined
    const sync = () => { layer.dataset.paused = document.hidden ? 'true' : 'false' }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  return (
    <div ref={ref} className="app-bg" aria-hidden="true">
      <div className="app-bg__mesh">
        <span className="app-bg__blob app-bg__blob--a" />
        <span className="app-bg__blob app-bg__blob--b" />
        <span className="app-bg__blob app-bg__blob--c" />
      </div>
      <div className="app-bg__grid" />
      <div className="app-bg__grain" />
    </div>
  )
}
