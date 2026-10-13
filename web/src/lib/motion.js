export const motionQuery = '(prefers-reduced-motion: no-preference)'
export const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

export const motion = Object.freeze({
  feedback: 0.16,
  selection: 0.24,
  content: 0.36,
  entrance: 0.52,
  ease: 'power3.out',
})

export function prefersReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches
}
