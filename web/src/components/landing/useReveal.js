import { useEffect } from 'react'

const reveal = (group) => {
  group.classList.add('is-revealed')
  group.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-revealed'))
}

/**
 * One shared reveal-on-scroll behaviour for landing sections.
 *
 * Mark a container `data-reveal-group` and the things inside it `data-reveal="heading" | "item"`.
 * When the group nears the viewport (rootMargin starts it just before it is visible) every marked
 * element gains `.is-revealed` once; CSS staggers them by `--reveal-i`. Content is fully visible by
 * default: styles only hide it under `html.js`, and `window.__revealReady` cancels the HTML failsafe
 * that un-hides everything if the app never starts. Never use it on elements that run their own engine.
 */
export function useReveal(rootRef, { rootMargin = '0px 0px 6% 0px' } = {}) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    window.__revealReady = true

    const groups = root.matches('[data-reveal-group]') ? [root] : [...root.querySelectorAll('[data-reveal-group]')]
    if (!groups.length) groups.push(root)
    groups.forEach((group) => {
      group.querySelectorAll('[data-reveal]').forEach((element, index) => element.style.setProperty('--reveal-i', Math.min(index, 8)))
    })

    if (!('IntersectionObserver' in window)) { groups.forEach(reveal); return undefined }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        reveal(entry.target)
        observer.unobserve(entry.target)
      })
    }, { rootMargin })
    groups.forEach((group) => observer.observe(group))
    return () => observer.disconnect()
  }, [rootRef, rootMargin])
}
