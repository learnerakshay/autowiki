/*
 * Toast system. `toast(...)` can be called from anywhere (no provider); <Toaster /> renders the stack once.
 *   toast({ title, description, tone: 'info' | 'success' | 'error', duration, action: { label, onClick } })
 *   toast.success('Saved') · toast.error('Failed', { description }) · toast.info(...) · toast.dismiss(id?)
 * An existing id is replaced, so a status can update in place. There is no progress value: a toast reports
 * what happened, not how far along something is.
 */
let items = []
let counter = 0
const listeners = new Set()
const emit = () => listeners.forEach((listener) => listener())
export const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener) }
export const snapshot = () => items
const EXIT_MS = 420

export function toast(input) {
  const options = typeof input === 'string' ? { title: input } : input
  const id = options.id ?? options.key ?? `toast-${++counter}`
  const next = { tone: 'info', announce: true, duration: options.tone === 'error' ? 8000 : 4000, ...options, id, leaving: false }
  items = [...items.filter((item) => item.id !== id), next]
  while (items.length > 3) {
    const index = items.findIndex((item) => typeof document === 'undefined' || !document.querySelector(`[data-toast-id="${CSS.escape(item.id)}"]`)?.contains(document.activeElement))
    items.splice(index < 0 ? 0 : index, 1)
  }
  emit()
  return id
}
toast.success = (title, options) => toast({ ...options, title, tone: 'success' })
toast.error = (title, options) => toast({ ...options, title, tone: 'error' })
toast.info = (title, options) => toast({ ...options, title, tone: 'info' })
toast.dismiss = (id, swipe) => {
  const targets = id ? [id] : items.map((item) => item.id)
  items = items.map((item) => (targets.includes(item.id) ? { ...item, leaving: true, swipe } : item))
  emit()
  window.setTimeout(() => { items = items.filter((item) => !(targets.includes(item.id) && item.leaving)); emit() }, EXIT_MS)
}

