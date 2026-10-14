import { Link } from 'react-router-dom'
import { brand } from '../../config/brand.js'
import { Logo } from './Logo.jsx'

/** The logo as a link home. The nav, the footer and the app header all use this one component. */
export function BrandLink({ className = '', tone = 'auto', animated = false }) {
  return (
    <Link to="/" className={`brand ${className}`.trim()} aria-label={`${brand.name} home`}>
      <Logo variant="lockup" tone={tone} animated={animated} />
    </Link>
  )
}
