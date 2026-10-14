// Keep cancellation paired with the scheduler chosen for this callback.
export function whenIdle(callback, timeout = 1200, fallbackDelay = 200) {
  if (typeof window.requestIdleCallback === 'function' && typeof window.cancelIdleCallback === 'function') {
    const cancel = window.cancelIdleCallback.bind(window)
    const handle = window.requestIdleCallback(callback, { timeout })
    return () => cancel(handle)
  }
  const handle = setTimeout(callback, fallbackDelay)
  return () => clearTimeout(handle)
}
export const cancelIdle = (cancel) => cancel?.()
