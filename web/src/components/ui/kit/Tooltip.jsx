import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './tooltip.css'

const MARGIN = 8
const GAP = 10
let warmUntil = 0 // moving between tooltips within this window skips the open delay

/**
 * Hover and keyboard-focus tooltip for a single child. It is portalled and clamped to the viewport (so no ancestor
 * can clip it), flips to the other side when there is no room, closes on Esc, scroll and blur, and never opens for touch.
 */
export function Tooltip({ content, children, placement = 'top', delay = 450 }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  const wrapperRef = useRef(null)
  const tipRef = useRef(null)
  const timer = useRef(0)

  const show = useCallback((instant) => {
    clearTimeout(timer.current)
    const wait = instant || performance.now() < warmUntil ? 0 : delay
    timer.current = window.setTimeout(() => { openRef.current = true; setOpen(true) }, wait)
  }, [delay])
  const hide = useCallback(() => {
    clearTimeout(timer.current)
    if (openRef.current) warmUntil = performance.now() + 300
    openRef.current = false
    setOpen(false)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => { if (event.key === 'Escape') hide() }
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', hide, { passive: true, capture: true })
    window.addEventListener('resize', hide)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', hide, { capture: true })
      window.removeEventListener('resize', hide)
    }
  }, [open, hide])

  useLayoutEffect(() => {
    const tip = tipRef.current
    const trigger = wrapperRef.current?.firstElementChild
    if (!open || !tip || !trigger) return
    const anchor = trigger.getBoundingClientRect()
    const size = tip.getBoundingClientRect()
    let side = placement
    if (side === 'top' && anchor.top - size.height - GAP < MARGIN) side = 'bottom'
    else if (side === 'bottom' && anchor.bottom + size.height + GAP > window.innerHeight - MARGIN) side = 'top'
    const x = Math.min(Math.max(MARGIN, anchor.left + anchor.width / 2 - size.width / 2), window.innerWidth - size.width - MARGIN)
    const y = side === 'top' ? anchor.top - size.height - GAP : anchor.bottom + GAP
    tip.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
    tip.dataset.side = side
  }, [open, placement, content])

  // The trigger is described while the tooltip is open. A display:contents wrapper carries the listeners, so the
  // child element is used exactly as given (no cloning, no ref merging).
  useEffect(() => {
    const child = wrapperRef.current?.firstElementChild
    if (!open || !child) return undefined
    const previous = child.getAttribute('aria-describedby')
    child.setAttribute('aria-describedby', previous ? `${previous} ${id}` : id)
    return () => { if (previous) child.setAttribute('aria-describedby', previous); else child.removeAttribute('aria-describedby') }
  }, [open, id])

  if (!content) return children
  return (
    <>
      <span
        ref={wrapperRef}
        className="ui-tooltip-anchor"
        onPointerEnter={(event) => { if (event.pointerType !== 'touch') show(false) }}
        onPointerLeave={hide}
        onPointerDown={hide}
        onFocus={(event) => { if (event.target.matches?.(':focus-visible')) show(true) }}
        onBlur={hide}
      >
        {children}
      </span>
      {open ? createPortal(<div ref={tipRef} id={id} role="tooltip" className="ui-tooltip">{content}</div>, document.body) : null}
    </>
  )
}
