import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AlertCircle, Check } from 'lucide-react'
import clsx from 'clsx'
import './field.css'

/**
 * Text input with optional prefix / suffix slots. Styled shell, unstyled control: the whole shell shows the
 * focus ring, so prefix and suffix icons sit inside the field. `mono` is the repo-field variant.
 */
export function Input({ prefix, suffix, mono = false, invalid = false, multiline = false, maxRows = 8, className, shellClassName, ref, ...props }) {
  const Control = multiline ? 'textarea' : 'input'
  const inner = useRef(null)
  const setRef = (node) => {
    inner.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  // Autosize: grow with the content up to `maxRows`, then scroll.
  useLayoutEffect(() => {
    const element = inner.current
    if (!multiline || !element) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }, [multiline, props.value])

  return (
    <span className={clsx('ui-field__shell', mono && 'is-mono', invalid && 'is-invalid', props.disabled && 'is-disabled', multiline && 'is-multiline', shellClassName)} style={multiline ? { '--rows': maxRows } : undefined}>
      {prefix ? <span className="ui-field__affix ui-field__affix--prefix">{prefix}</span> : null}
      <Control ref={setRef} className={clsx('ui-field__control', className)} aria-invalid={invalid || undefined} {...props} />
      {suffix ? <span className="ui-field__affix ui-field__affix--suffix">{suffix}</span> : null}
    </span>
  )
}

/**
 * Labelled field with a hint, inline validation and an always-present aria-live message line (reserved height, so
 * errors never shift the layout).
 *
 * `validate(value)` returns an error string or '' and runs while typing and on blur, never only on submit: an error
 * clears the moment the value is fixed; a new error appears after a short pause while typing (so half-typed input
 * isn't scolded) and immediately on blur. `error` and `success` can also be passed in from outside.
 */
export function TextField({ label, hint, validate, validateDelay = 600, error: errorProp, success, required = false, id: idProp, className, value, defaultValue, onChange, onBlur, ...input }) {
  const generated = useId()
  const id = idProp ?? generated
  const [internal, setInternal] = useState(defaultValue ?? '')
  const [shown, setShown] = useState('')
  const touched = useRef(false)
  const timer = useRef(0)
  const controlled = value !== undefined
  const current = controlled ? value : internal

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleChange = (event) => {
    const next = event.target.value
    if (!controlled) setInternal(next)
    onChange?.(event)
    if (!validate) return
    clearTimeout(timer.current)
    const message = validate(next)
    if (!message) { setShown(''); return }
    if (touched.current) setShown(message)
    else timer.current = window.setTimeout(() => setShown(message), validateDelay)
  }
  const handleBlur = (event) => {
    touched.current = true
    clearTimeout(timer.current)
    if (validate) setShown(validate(event.target.value))
    onBlur?.(event)
  }

  const message = errorProp || shown
  const hintId = `${id}-hint`
  const messageId = `${id}-message`
  return (
    <div className={clsx('ui-field', className)}>
      <label className="ui-field__label" htmlFor={id}>
        {label}
        {required ? <span className="ui-field__required" aria-hidden="true"> *</span> : null}
      </label>
      {hint ? <p className="ui-field__hint" id={hintId}>{hint}</p> : null}
      <Input
        {...input}
        id={id}
        value={current}
        required={required}
        invalid={Boolean(message)}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-describedby={clsx(hint && hintId, messageId)}
      />
      <p className={clsx('ui-field__message', message && 'is-error', !message && success && 'is-success')} id={messageId} aria-live="polite">
        {message ? <><AlertCircle aria-hidden="true" />{message}</> : success ? <><Check aria-hidden="true" />{success}</> : null}
      </p>
    </div>
  )
}

/** Autosizing textarea field (same API as TextField). */
export const TextareaField = (props) => <TextField multiline {...props} />
