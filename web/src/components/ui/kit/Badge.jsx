import { Check, Info, Minus, X } from 'lucide-react'
import clsx from 'clsx'
import './badge.css'

/** Small static label. tone: neutral | accent | info. */
export function Badge({ tone = 'neutral', icon: Icon, className, children, ...rest }) {
  return (
    <span className={clsx('ui-badge', `ui-badge--${tone}`, className)} {...rest}>
      {Icon ? <Icon className="ui-badge__icon" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

/**
 * Chip: a selectable filter / suggestion. `selected` is exposed as aria-pressed. Renders a button when it has
 * an onClick, otherwise a static span.
 */
export function Chip({ selected = false, icon: Icon, onClick, className, children, ...rest }) {
  const classes = clsx('ui-chip', selected && 'is-selected', className)
  const content = (
    <>
      {Icon ? <Icon className="ui-chip__icon" aria-hidden="true" /> : null}
      {children}
    </>
  )
  if (!onClick) return <span className={classes} {...rest}>{content}</span>
  return <button type="button" className={classes} aria-pressed={selected} onClick={onClick} {...rest}>{content}</button>
}

const STATES = {
  idle: { label: 'Idle', Icon: Minus },
  pending: { label: 'Pending', Icon: null },
  succeeded: { label: 'Succeeded', Icon: Check },
  failed: { label: 'Failed', Icon: X },
  info: { label: 'Info', Icon: Info },
}

/**
 * Status pill. Every state has an icon AND text (never colour alone).
 * `pending` is deliberately indeterminate: a breathing ring and a label. It never shows a percentage, a queue
 * position or an ETA, because the application does not know any of them.
 */
export function StatusPill({ state = 'idle', className, children, ...rest }) {
  const { label, Icon } = STATES[state] ?? STATES.idle
  return (
    <span className={clsx('ui-status', `ui-status--${state}`, className)} {...rest}>
      <span className="ui-status__icon" aria-hidden="true">{Icon ? <Icon /> : <i className="ui-status__ring" />}</span>
      {children ?? label}
    </span>
  )
}
