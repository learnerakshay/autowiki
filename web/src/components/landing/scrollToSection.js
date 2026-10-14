import { motionPreference } from '../../lib/motion.js'
import { loadAllSections } from './loadAll.js'
import { reducedMotionQuery } from '../../lib/motion.js'

const frames = (count) => new Promise((resolve) => {
  const step = (left) => (left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1)))
  step(count)
})

function whenReady(element) {
  if (element.dataset.ready === 'true') return Promise.resolve()
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (element.dataset.ready === 'true') { observer.disconnect(); clearTimeout(timeout); resolve() }
    })
    observer.observe(element, { attributes: true, attributeFilter: ['data-ready'] })
    const timeout = setTimeout(() => { observer.disconnect(); resolve() }, 8000)
  })
}

/**
 * Scroll to an on-page section. Below-the-fold sections are code-split, so the real layout has to
 * exist first: ask them all to load, wait (briefly) for the target to mount, then scroll.
 */
export async function scrollToSection(id, { updateHash = true } = {}) {
  const target = document.getElementById(id)
  if (!target) return
  loadAllSections()
  const sections = [...document.querySelectorAll('[data-lazy-section]')]
  await Promise.all(sections.slice(0, sections.indexOf(target) + 1).map(whenReady))
  await frames(2) // let measured layouts (pinned stages) settle
  const calm = motionPreference(reducedMotionQuery).matches
  target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
  if (updateHash) history.replaceState(null, '', `#${id}`)
}
