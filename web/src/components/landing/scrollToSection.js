import { loadAllSections } from './loadAll.js'
import { reducedMotionQuery } from '../../lib/motion.js'

const frames = (count) => new Promise((resolve) => {
  const step = (left) => (left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1)))
  step(count)
})

/**
 * Scroll to an on-page section. Below-the-fold sections are code-split, so the real layout has to
 * exist first: ask them all to load, wait (briefly) for the target to mount, then scroll.
 */
export async function scrollToSection(id, { updateHash = true } = {}) {
  const target = document.getElementById(id)
  if (!target) return
  loadAllSections()
  const deadline = performance.now() + 2500
  while (!target.firstElementChild && performance.now() < deadline) await frames(2)
  await frames(2) // let measured layouts (pinned stages) settle
  const calm = window.matchMedia(reducedMotionQuery).matches
  target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
  if (updateHash) history.replaceState(null, '', `#${id}`)
}
