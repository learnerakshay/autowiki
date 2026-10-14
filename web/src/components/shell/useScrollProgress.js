import { useEffect, useState } from 'react'

/**
 * Writes page scroll progress (0..1) to a hairline element as `scaleX`, without re-rendering per frame, and reports
 * whether the page has scrolled at all. The hairline only shows on pages long enough to need it. `resetKey` (the
 * pathname) re-measures when the content changes.
 */
export function useScrollProgress(progressRef, resetKey) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const progress = max > 1 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      const bar = progressRef.current
      if (bar) {
        bar.style.transform = `scaleX(${progress.toFixed(4)})`
        bar.style.opacity = max > window.innerHeight * 0.5 ? '1' : '0'
      }
      setScrolled(window.scrollY > 24)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const resize = new ResizeObserver(schedule)
    resize.observe(document.documentElement)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      resize.disconnect()
    }
  }, [progressRef, resetKey])
  return scrolled
}
