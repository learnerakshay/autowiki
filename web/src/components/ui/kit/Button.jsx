import { useId } from 'react'
import clsx from 'clsx'
import { Tooltip } from './Tooltip.jsx'
import './button.css'

/**
 * Button / link-button. Variants: primary (near-black), secondary (outline), ghost. Sizes: sm, md, lg, icon.
 *
 * loading     indeterminate: a breathing dot, never a percentage. The label keeps its width (the dot sits in the padding),
 *             the button stays focusable, and clicks are ignored while it is busy.
 * disabled    legible (>= 4.5:1). Pass `disabledReason` to explain why: the button then stays focusable
 *             (aria-disabled) so keyboard and screen-reader users can reach the explanation, shown as a tooltip.
 * as          render another element, e.g. `as={Link} to="/workspace"`.
 */
export function Button({ variant = 'primary', size = 'md', loading = false, disabled = false, disabledReason, iconLeading: Leading, iconTrailing: Trailing, as: Tag = 'button', className, children, onClick, type, ...rest }) {
  const reasonId = useId()
  const explained = disabled && Boolean(disabledReason)
  const inert = loading || disabled
  const props = {
    ...rest,
    className: clsx('ui-btn', `ui-btn--${variant}`, `ui-btn--${size}`, loading && 'is-loading', disabled && 'is-disabled', className),
    'aria-busy': loading || undefined,
    'aria-disabled': inert && (explained || loading || Tag !== 'button') ? true : undefined,
    'aria-describedby': explained ? reasonId : rest['aria-describedby'],
    disabled: disabled && !explained && Tag === 'button' ? true : undefined,
    onClick: (event) => { if (inert) { event.preventDefault(); return } onClick?.(event) },
  }
  if (Tag === 'button') props.type = type ?? 'button'

  const element = (
    <Tag {...props}>
      {loading ? <span className="ui-dot" aria-hidden="true" /> : null}
      {Leading ? <Leading className="ui-btn__icon" aria-hidden="true" /> : null}
      {children != null ? <span className="ui-btn__label">{children}</span> : null}
      {Trailing ? <Trailing className="ui-btn__icon ui-btn__icon--trailing" aria-hidden="true" /> : null}
    </Tag>
  )
  if (!explained) return element
  return (
    <>
      <Tooltip content={disabledReason}>{element}</Tooltip>
      <span id={reasonId} className="ui-sr-only">{disabledReason}</span>
    </>
  )
}

/** Square 44px icon button. `label` is the accessible name (and the tooltip). */
export function IconButton({ label, icon: Icon, tooltip = true, variant = 'ghost', ...rest }) {
  const button = (
    <Button {...rest} variant={variant} size="icon" aria-label={label}>
      <Icon className="ui-btn__icon" aria-hidden="true" />
    </Button>
  )
  return tooltip && !rest.disabled ? <Tooltip content={label}>{button}</Tooltip> : button
}
