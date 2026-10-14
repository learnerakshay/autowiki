import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { reducedMotionQuery } from '../../../lib/motion.js'

const subscribeReduced = (callback) => {
  const query = window.matchMedia(reducedMotionQuery)
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}

/** Live `prefers-reduced-motion: reduce`. */
export const useReducedMotion = () => useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedMotionQuery).matches, () => false)

/**
 * Positions a sliding indicator under the element marked `data-active="true"` inside `listRef`. It writes
 * `--ind-x` / `--ind-w` straight to the indicator (no re-render), enables its spring transition only after the first
 * placement (so it never animates in from nowhere), and re-places on resize and when the font finishes loading.
 */
export function useSlidingIndicator(listRef, indicatorRef, activeKey) {
  useLayoutEffect(() => {
    const list = listRef.current
    const bar = indicatorRef.current
    if (!list || !bar) return undefined
    const place = () => {
      const active = list.querySelector('[data-active="true"]')
      if (!active) { bar.style.opacity = '0'; return }
      bar.style.setProperty('--ind-x', `${active.offsetLeft}px`)
      bar.style.setProperty('--ind-w', `${active.offsetWidth}px`)
      bar.style.setProperty('--ind-h', `${active.offsetHeight}px`)
      bar.style.setProperty('--ind-y', `${active.offsetTop}px`)
      bar.style.opacity = '1'
    }
    place()
    const frame = requestAnimationFrame(() => { bar.dataset.ready = 'true' })
    const observer = new ResizeObserver(place)
    observer.observe(list)
    document.fonts?.ready.then(place)
    return () => { cancelAnimationFrame(frame); observer.disconnect() }
  }, [listRef, indicatorRef, activeKey])
}

export const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
export const focusableIn = (element) => [...element.querySelectorAll(FOCUSABLE)].filter((node) => node.getClientRects().length > 0)

let scrollLocks = 0
/** Reference-counted scroll lock that keeps the layout from jumping when the scrollbar disappears. */
export function lockScroll() {
  if (scrollLocks++ > 0) return
  const root = document.documentElement
  const gutter = window.innerWidth - root.clientWidth
  root.style.overflow = 'hidden'
  if (gutter > 0) root.style.paddingRight = `${gutter}px`
}
export function unlockScroll() {
  if (--scrollLocks > 0) return
  scrollLocks = 0
  const root = document.documentElement
  root.style.overflow = ''
  root.style.paddingRight = ''
}

/**
 * Modal behaviour shared by Dialog, Sheet and any other overlay: the app root becomes inert, scroll is locked,
 * focus moves into the panel and is trapped there, Esc closes, and focus returns to whatever opened it.
 */
export function useModalBehavior({ open, onClose, panelRef, restoreRef }) {
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })
  useEffect(() => {
    if (!open) return undefined
    const restore = restoreRef?.current ?? document.activeElement
    const app = document.getElementById('root')
    app?.setAttribute('inert', '')
    lockScroll()
    const panel = panelRef.current
    const start = panel?.querySelector('[data-autofocus]') ?? (panel ? focusableIn(panel)[0] : null) ?? panel
    start?.focus({ preventScroll: true })
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current?.(); return }
      if (event.key !== 'Tab' || !panelRef.current) return
      const items = focusableIn(panelRef.current)
      if (!items.length) { event.preventDefault(); return }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      app?.removeAttribute('inert')
      unlockScroll()
      if (restore instanceof HTMLElement && document.contains(restore)) restore.focus({ preventScroll: true })
    }
  }, [open, panelRef, restoreRef])
}
