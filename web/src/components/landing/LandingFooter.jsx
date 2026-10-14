import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { BrandLink } from '../brand/BrandLink.jsx'
import { brand } from '../../config/brand.js'
import { footer, sections } from '../../data/landingCopy.js'
import { reducedMotionQuery } from '../../lib/motion.js'
import { scrollToSection } from './scrollToSection.js'
import './footer.css'

/** Flips to true once, when the footer first comes into view. The reveal is transform/opacity only. */
function useEntered(ref) {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element || !('IntersectionObserver' in window)) { setEntered(true); return undefined }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setEntered(true)
      observer.disconnect()
    }, { threshold: 0.25 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return entered
}

export function LandingFooter() {
  const ref = useRef(null)
  const entered = useEntered(ref)
  const backToTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia(reducedMotionQuery).matches ? 'auto' : 'smooth' })

  return (
    <footer ref={ref} className="lf" data-entered={entered} data-logo-surface="dark">
      <div className="lf__inner lp-container">
        <div className="lf__brand">
          <BrandLink tone="dark" />
          <p>{brand.blurb}</p>
          {brand.repoUrl ? <a className="lf__source" href={brand.repoUrl} target="_blank" rel="noreferrer noopener">Source on GitHub</a> : null}
        </div>

        <nav className="lf__col" aria-label="Footer: page sections">
          <p className="lf__label">On this page</p>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} onClick={(event) => { event.preventDefault(); scrollToSection(section.id) }}>{section.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="lf__col" aria-label="Footer: product">
          <p className="lf__label">Product</p>
          <ul>
            {footer.product.map((link) => <li key={link.to}><Link to={link.to}>{link.label}</Link></li>)}
          </ul>
        </nav>

        <button type="button" className="lf__top" onClick={backToTop}>Back to top <ArrowUp aria-hidden="true" /></button>
      </div>

      {brand.credits ? <p className="lf__credits lp-container">{brand.credits}</p> : null}

      <div className="lf__wordmark" aria-hidden="true"><span>{brand.name}</span></div>
    </footer>
  )
}
