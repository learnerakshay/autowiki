import clsx from 'clsx'
import './misc.css'

/** A keyboard key, e.g. <Kbd>Esc</Kbd>. */
export function Kbd({ className, children, ...rest }) {
  return <kbd className={clsx('ui-kbd', className)} {...rest}>{children}</kbd>
}

/** Hairline rule. Decorative unless it is given a label. */
export function Divider({ orientation = 'horizontal', label, className }) {
  return label
    ? <div className={clsx('ui-divider ui-divider--label', className)} role="separator" aria-label={label}><span aria-hidden="true">{label}</span></div>
    : <hr className={clsx('ui-divider', `ui-divider--${orientation}`, className)} aria-orientation={orientation} />
}

/**
 * Loading placeholder. The shimmer is a transform-only sweep and is static under reduced motion. Decorative:
 * the screen-reader announcement belongs to the region that is loading (aria-busy), not to the placeholder.
 */
export function Skeleton({ width, height = '1em', radius, className, style, ...rest }) {
  return <span className={clsx('ui-skeleton', className)} aria-hidden="true" style={{ width, height, borderRadius: radius, ...style }} {...rest} />
}

/** A block of skeleton text lines; the last line is shorter. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <span className={clsx('ui-skeleton-text', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => <Skeleton key={index} height="0.8em" width={index === lines - 1 && lines > 1 ? '62%' : '100%'} />)}
    </span>
  )
}
