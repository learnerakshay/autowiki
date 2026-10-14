import { useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { prefersReducedMotion, reduced, springCss, springDuration } from '../../../lib/motion.js'
import './disclosure.css'

/**
 * One disclosure (a button that shows or hides a region). The height animates with the shared spring (the one
 * place height is animated; the panel is out of flow while it moves). It is interruptible: toggling mid-flight
 * continues from the current height. Reduced motion: no animation.
 */
export function Disclosure({ title, defaultOpen = false, open: openProp, onOpenChange, className, children }) {
  const id = useId()
  const [internal, setInternal] = useState(defaultOpen)
  const open = openProp ?? internal
  const [startHidden] = useState(!open)
  const panelRef = useRef(null)
  const animation = useRef(null)
  const lastOpen = useRef(open)

  // Runs when `open` changes (from the button or from a controlling parent): animate the panel to its new state.
  const sync = (node) => {
    panelRef.current = node
    if (!node || lastOpen.current === open) return
    lastOpen.current = open
    const from = node.hidden ? 0 : node.getBoundingClientRect().height
    animation.current?.cancel()
    if (open) node.hidden = false
    const to = open ? node.scrollHeight : 0
    if (from === to) { node.hidden = !open; return }
    if (prefersReducedMotion()) {
      const run = node.animate([{ opacity: open ? 0 : 1 }, { opacity: open ? 1 : 0 }], { duration: reduced.fade * 1000, easing: getComputedStyle(node).getPropertyValue('--ease-out').trim() })
      animation.current = run
      run.onfinish = () => { node.hidden = !open; animation.current = null }
      return
    }
    node.style.overflow = 'hidden'
    const run = node.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: springDuration.default * 1000, easing: springCss.default })
    animation.current = run
    run.onfinish = () => { node.hidden = !open; node.style.overflow = ''; animation.current = null }
  }

  const toggle = () => {
    if (openProp === undefined) setInternal(!open)
    onOpenChange?.(!open)
  }

  return (
    <div className={clsx('ui-disc', open && 'is-open', className)}>
      <button type="button" className="ui-disc__trigger" aria-expanded={open} aria-controls={`${id}-panel`} id={`${id}-trigger`} onClick={toggle}>
        <span>{title}</span>
        <ChevronDown className="ui-disc__chevron" aria-hidden="true" />
      </button>
      <div ref={sync} id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`} className="ui-disc__panel" hidden={startHidden}>
        <div className="ui-disc__body">{children}</div>
      </div>
    </div>
  )
}

/** A stack of disclosures; `single` keeps at most one open. `items` is `[{ id, title, content }]`. */
export function Accordion({ items, single = false, className }) {
  const [openIds, setOpenIds] = useState(() => new Set())
  const change = (itemId, next) => setOpenIds((previous) => {
    const result = single ? new Set() : new Set(previous)
    if (next) result.add(itemId)
    else result.delete(itemId)
    return result
  })
  return (
    <div className={clsx('ui-accordion', className)}>
      {items.map((item) => <Disclosure key={item.id} title={item.title} open={openIds.has(item.id)} onOpenChange={(next) => change(item.id, next)}>{item.content}</Disclosure>)}
    </div>
  )
}
