import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import './pill-nav.css'

const FOCUSABLE = 'a[href], button:not([disabled])'

/**
 * The floating pill nav shared by the landing page and the app: pill bar, brand slot, equal-width item list with a
 * spring-sliding active pill, a CTA slot, a hairline progress indicator, a soft scroll edge, and a mobile sheet that
 * traps focus, closes on Esc and makes the page behind inert.
 *
 * It owns presentation and the mobile sheet only. What is active, what the CTA is and what the header's data
 * attributes say are decided by the wrapper (LandingNav: scroll-spy; AppNav: the route).
 *
 *   items         [{ key, label, to | href, onClick?, state? }]  rendered as <Link> or <a>
 *   activeIndex   index of the active item (-1: none, the pill hides); it gets aria-current={current}
 *   cta           node for the CTA slot (it sits in one grid cell, so swapping buttons never changes the bar's width)
 *   sheetActions  node shown under the links in the mobile sheet
 *   headerProps   extra attributes for the <header> (data-scrolled, data-tone, ...)
 *   inertSelectors  what to make inert while the sheet is open
 */
export function PillNav({ brand, items, activeIndex = -1, current = 'location', linksLabel, menuLabel = 'Menu sections', cta, sheetActions, inertSelectors = '#main-content', headerProps, barRef, progressRef, variant = 'landing' }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const sheetRef = useRef(null)
  const close = useCallback(() => setOpen(false), [])

  // Mobile sheet: Esc closes, focus is trapped, the page behind is inert and doesn't scroll.
  useEffect(() => {
    if (!open) return undefined
    const menu = menuRef.current
    const behind = [...document.querySelectorAll(inertSelectors)]
    behind.forEach((element) => element.setAttribute('inert', ''))
    document.documentElement.style.overflow = 'hidden'
    sheetRef.current?.querySelector(FOCUSABLE)?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return }
      if (event.key !== 'Tab') return
      const focusable = [menuRef.current, ...sheetRef.current.querySelectorAll(FOCUSABLE)].filter(Boolean)
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      behind.forEach((element) => element.removeAttribute('inert'))
      document.documentElement.style.overflow = ''
      menu?.focus({ preventScroll: true })
    }
  }, [open, inertSelectors])

  const renderItem = (item, index, onNavigate) => {
    const shared = {
      className: 'ln__link',
      'aria-current': index === activeIndex ? current : undefined,
      onClick: (event) => { item.onClick?.(event); onNavigate?.() },
      onMouseEnter: item.onIntent,
      onFocus: item.onIntent,
    }
    return item.to
      ? <Link key={item.key} to={item.to} state={item.state} {...shared}>{item.label}</Link>
      : <a key={item.key} href={item.href} {...shared}>{item.label}</a>
  }

  return (
    <header className="ln" data-variant={variant} data-open={open} {...headerProps}>
      <div className="ln__edge" aria-hidden="true" />
      <div ref={barRef} className="ln__bar">
        {brand}

        <nav className="ln__links" aria-label={linksLabel} style={{ '--count': items.length, '--spy': Math.max(0, activeIndex) }}>
          <span className="ln__pill" aria-hidden="true" data-on={activeIndex >= 0} />
          {items.map((item, index) => renderItem(item, index))}
        </nav>

        <div className="ln__cta">{cta}</div>

        <button
          ref={menuRef}
          type="button"
          className="ln__menu"
          aria-expanded={open}
          aria-controls="ln-sheet"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>

        <span ref={progressRef} className="ln__progress" aria-hidden="true" />
      </div>

      <div className="ln__scrim" aria-hidden="true" onClick={close} data-open={open} />
      <div ref={sheetRef} id="ln-sheet" className="ln__sheet" role="dialog" aria-modal="true" aria-label="Menu" data-open={open} inert={!open}>
        <nav aria-label={menuLabel}>
          {items.map((item, index) => renderItem(item, index, close))}
        </nav>
        <div className="ln__sheet-actions" onClick={(event) => { if (event.target.closest('a')) close() }}>{sheetActions}</div>
      </div>
    </header>
  )
}
