import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { projectDistance, rubberBand } from '../../../lib/carouselEngine.js'
import { FLICK_VELOCITY, springDuration } from '../../../lib/motion.js'
import { IconButton } from './Button.jsx'
import { useModalBehavior } from './hooks.js'
import './overlay.css'

const EXIT_MS = Math.round(springDuration.default * 1000) + 80
const NARROW = '(max-width: 640px)'

/**
 * Presence for an overlay: it is mounted while open and for the length of its exit, and `state` flips to "open" one
 * frame after mounting so the entrance transition has a starting point. Reopening mid-exit just continues.
 */
function useOverlayState(open) {
  const [present, setPresent] = useState(open)
  const [entered, setEntered] = useState(false)
  if (open && !present) setPresent(true)
  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
      return () => cancelAnimationFrame(frame)
    }
    const timer = window.setTimeout(() => { setPresent(false); setEntered(false) }, EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [open])
  return { present, state: open && entered ? 'open' : 'closed' }
}

function Overlay({ kind, open, onOpenChange, title, description, triggerRef, size = 'md', side = 'right', className, children }) {
  const { present, state } = useOverlayState(open)
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef(null)
  const drag = useRef(null)
  useModalBehavior({ open, onClose: () => onOpenChange(false), panelRef, restoreRef: triggerRef })

  // Each open starts from the rest state; a dialog scales out from the control that opened it.
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!open || !panel) return
    panel.style.transform = ''
    if (kind !== 'dialog') return
    const trigger = triggerRef?.current ?? document.activeElement
    if (!(trigger instanceof HTMLElement) || trigger === document.body) return
    const box = trigger.getBoundingClientRect()
    panel.style.transformOrigin = `${box.left + box.width / 2 - panel.offsetLeft}px ${box.top + box.height / 2 - panel.offsetTop}px`
  }, [open, kind, triggerRef, present])

  // Drag-to-dismiss for the bottom sheet (phones). Release uses the same velocity projection as the carousel.
  const bottomSheet = () => kind === 'sheet' && (side === 'bottom' || window.matchMedia(NARROW).matches)
  const onPointerDown = (event) => {
    if (!bottomSheet() || event.button !== 0 || event.target.closest('button, a, input, textarea, select')) return
    const panel = panelRef.current
    drag.current = { pointer: event.pointerId, y0: event.clientY, y: 0, last: event.clientY, time: performance.now(), velocity: 0, height: panel.offsetHeight }
    event.currentTarget.setPointerCapture(event.pointerId)
    panel.dataset.dragging = 'true'
  }
  const onPointerMove = (event) => {
    const state_ = drag.current
    if (!state_ || event.pointerId !== state_.pointer) return
    const now = performance.now()
    state_.velocity = 0.8 * state_.velocity + 0.2 * ((event.clientY - state_.last) / Math.max(1, now - state_.time)) * 1000
    state_.last = event.clientY
    state_.time = now
    const dy = event.clientY - state_.y0
    state_.y = dy
    panelRef.current.style.transform = `translate3d(0, ${dy >= 0 ? dy : rubberBand(dy, 160)}px, 0)`
  }
  const onPointerUp = (event) => {
    const state_ = drag.current
    if (!state_ || event.pointerId !== state_.pointer) return
    drag.current = null
    const panel = panelRef.current
    delete panel.dataset.dragging
    const projected = state_.y + projectDistance(state_.velocity)
    // Dismiss on a flick, on a drag past a third of the sheet, or when the projected landing is well past the middle.
    if (state_.velocity > FLICK_VELOCITY || state_.y > state_.height * 0.35 || projected > state_.height * 0.6) {
      panel.style.transform = 'translate3d(0, 100%, 0)'
      onOpenChange(false)
    } else {
      panel.style.transform = ''
    }
  }
  const dragHandlers = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }

  if (!present) return null
  return createPortal(
    <div className="ui-layer" data-state={state} data-kind={kind} data-side={side}>
      <div className="ui-scrim" aria-hidden="true" onPointerDown={() => onOpenChange(false)} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={clsx('ui-overlay', `ui-overlay--${kind}`, kind === 'dialog' && `ui-overlay--${size}`, className)}
      >
        {kind === 'sheet' ? <div className="ui-overlay__grip" aria-hidden="true" {...dragHandlers}><i /></div> : null}
        <header className="ui-overlay__header" {...(kind === 'sheet' ? dragHandlers : {})}>
          <div>
            <h2 id={titleId} className="ui-overlay__title">{title}</h2>
            {description ? <p id={descriptionId} className="ui-overlay__description">{description}</p> : null}
          </div>
          <IconButton label="Close" icon={X} onClick={() => onOpenChange(false)} tooltip={false} />
        </header>
        <div className="ui-overlay__body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * Modal dialog. Focus is trapped and returned to the trigger, Esc and the scrim close it, the app behind is inert and
 * does not scroll. Pass `triggerRef` to anchor the entrance to the control that opened it (otherwise the focused
 * element is used). `data-autofocus` on a child chooses where focus lands.
 */
export function Dialog(props) {
  return <Overlay kind="dialog" {...props} />
}

/** Edge sheet (right by default). On phones it becomes a bottom sheet with drag-to-dismiss. */
export function Sheet(props) {
  return <Overlay kind="sheet" {...props} />
}

/** Right-aligned action row for a dialog or sheet body. */
export function OverlayActions({ children }) {
  return <div className="ui-overlay__actions">{children}</div>
}
