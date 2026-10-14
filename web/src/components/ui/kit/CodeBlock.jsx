import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import clsx from 'clsx'
import './code-block.css'

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Clipboard API unavailable (insecure context, permissions): fall back to a hidden textarea.
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.append(area)
    area.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    area.remove()
    return ok
  }
}

/**
 * Code with a language / path label, a copy button with confirmation, and horizontal overflow that fades at the
 * edges that still have content. The scroll area is keyboard-focusable. No syntax highlighting is applied: the
 * text is shown exactly as given.
 */
export function CodeBlock({ code, language, path, tone = 'light', className }) {
  const scrollRef = useRef(null)
  const [copy, setCopy] = useState('idle') // idle | copied | failed
  const timer = useRef(0)
  const label = path ?? language

  const updateFades = useCallback(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const max = scroller.scrollWidth - scroller.clientWidth
    scroller.dataset.fadeStart = scroller.scrollLeft > 1 ? 'true' : 'false'
    scroller.dataset.fadeEnd = max > 1 && scroller.scrollLeft < max - 1 ? 'true' : 'false'
  }, [])

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return undefined
    updateFades()
    const observer = new ResizeObserver(updateFades)
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [updateFades, code])

  useEffect(() => () => clearTimeout(timer.current), [])

  const onCopy = async () => {
    const ok = await copyText(code)
    setCopy(ok ? 'copied' : 'failed')
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopy('idle'), 2000)
  }

  return (
    <figure className={clsx('ui-code', `ui-code--${tone}`, className)} data-surface={tone === 'dark' ? 'dark' : undefined}>
      <figcaption className="ui-code__bar">
        <span className="ui-code__label">{label ?? 'Code'}</span>
        <button type="button" className="ui-code__copy" onClick={onCopy} data-state={copy}>
          {copy === 'copied' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          <span>{copy === 'copied' ? 'Copied' : copy === 'failed' ? 'Copy failed' : 'Copy'}</span>
        </button>
      </figcaption>
      <div ref={scrollRef} className="ui-code__scroll" role="region" aria-label={label ? `Code: ${label}` : 'Code'} tabIndex={0} onScroll={updateFades}>
        <pre className="ui-code__pre"><code>{code}</code></pre>
      </div>
      <span className="ui-sr-only" role="status" aria-live="polite">{copy === 'copied' ? 'Copied to clipboard' : copy === 'failed' ? 'Copy failed' : ''}</span>
    </figure>
  )
}
