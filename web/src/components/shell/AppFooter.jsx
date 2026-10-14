import { Link } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { BrandLink } from '../brand/BrandLink.jsx'
import { brand } from '../../config/brand.js'
import { prefersReducedMotion } from '../../lib/motion.js'
import { appNav } from './routes.js'
import './app-footer.css'

/**
 * Compact footer from the landing footer's family: dark bookend, the logo, section links, back to top, and the
 * brand config's optional source / credits lines (omitted when empty). The oversized wordmark is landing-only.
 * It is always rendered at the end of the page flow, so it never moves what is above it.
 */
export function AppFooter() {
  const backToTop = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  return (
    <footer className="app-footer" data-surface="dark" data-logo-surface="dark">
      <div className="app-footer__inner ui-container ui-container--content">
        <div className="app-footer__brand">
          <BrandLink tone="dark" />
          <p>{brand.blurb}</p>
        </div>

        <nav className="app-footer__links" aria-label="Footer">
          <ul>
            {appNav.map(({ key, label, to }) => <li key={key}><Link to={to}>{label}</Link></li>)}
            {brand.repoUrl ? <li><a href={brand.repoUrl} target="_blank" rel="noreferrer noopener">Source on GitHub</a></li> : null}
          </ul>
        </nav>

        <button type="button" className="app-footer__top" onClick={backToTop}>Back to top <ArrowUp aria-hidden="true" /></button>
      </div>
      {brand.credits ? <p className="app-footer__credits ui-container ui-container--content">{brand.credits}</p> : null}
    </footer>
  )
}
