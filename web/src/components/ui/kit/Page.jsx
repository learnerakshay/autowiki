import { useRef } from 'react'
import clsx from 'clsx'
import { useReveal } from '../../landing/useReveal.js'
import { Skeleton, SkeletonText } from './misc.jsx'
import './page.css'

/**
 * Width tracks (all centred, with the shared fluid gutter):
 *   content  72rem  the default for forms and cards
 *   wide     82rem  dashboards, sidebars + documents
 *   reading  46rem  long-form text (about 68 characters per line)
 * The landing page's `.lp-container` / `.lp-wide` are the same tracks.
 */
export function Container({ track = 'content', as: Tag = 'div', className, ...rest }) {
  return <Tag className={clsx('ui-container', `ui-container--${track}`, className)} {...rest} />
}

/** A page body: a track plus the standard vertical rhythm. */
export function Page({ track = 'content', as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag className={clsx('ui-page', className)} {...rest}>
      <Container track={track}>{children}</Container>
    </Tag>
  )
}

/**
 * Eyebrow + headline + subcopy in the landing's headline recipe (word-mask rise via the shared useReveal).
 * Renders an h1 by default; `size` picks the landing's display scale (`h2`) or the compact one.
 */
export function PageHeader({ eyebrow, title, lede, as: Heading = 'h1', id, size = 'compact', actions, className }) {
  const ref = useRef(null)
  useReveal(ref)
  const words = title.split(' ')
  return (
    <header ref={ref} data-reveal-group className={clsx('lp-head ui-page-header', size === 'compact' && 'lp-head--compact', className)}>
      {eyebrow ? <p className="lp-eyebrow" data-reveal="item">{eyebrow}</p> : null}
      <Heading id={id} className="lp-h2" data-reveal="heading" tabIndex={-1}>
        {words.map((word, index) => (
          <span key={`${word}-${index}`}>
            <span className="mw"><span className="mw__in" style={{ '--i': index }}>{word}</span></span>
            {index < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </Heading>
      {lede ? <p className="lp-lede" data-reveal="item">{lede}</p> : null}
      {actions ? <div className="ui-page-header__actions" data-reveal="item">{actions}</div> : null}
    </header>
  )
}

/** Centred empty / zero state: icon, title, description and an optional action. */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={clsx('ui-empty', className)}>
      {Icon ? <span className="ui-empty__icon" aria-hidden="true"><Icon /></span> : null}
      <h2 className="ui-empty__title">{title}</h2>
      {description ? <p className="ui-empty__text">{description}</p> : null}
      {action ? <div className="ui-empty__action">{action}</div> : null}
    </div>
  )
}

/** The same geometry as EmptyState, as a placeholder while the real content loads (no layout shift on swap). */
export function EmptyStateSkeleton({ className }) {
  return (
    <div className={clsx('ui-empty', className)} aria-hidden="true">
      <Skeleton width="3rem" height="3rem" radius="var(--r-m)" />
      <Skeleton width="min(16rem, 70%)" height="1.4rem" />
      <SkeletonText lines={2} className="ui-empty__lines" />
      <Skeleton width="9rem" height="2.75rem" radius="var(--r-pill)" />
    </div>
  )
}
