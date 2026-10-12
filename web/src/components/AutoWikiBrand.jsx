import { Link } from 'react-router-dom'

export function AutoWikiMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M6.5 3.75h7l4 4v12.5h-11z" />
        <path d="M13.5 3.75v4h4M9 9.5v5.25m0-2.75h3.25m0 0v3.25" />
        <circle cx="9" cy="8.75" r="1" />
        <circle cx="9" cy="15.5" r="1" />
        <circle cx="13" cy="15.5" r="1" />
      </svg>
    </span>
  )
}

export function AutoWikiBrand({ className = '' }) {
  return (
    <Link to="/" className={`brand ${className}`.trim()} aria-label="AutoWiki home">
      <AutoWikiMark />
      <span>AutoWiki</span>
    </Link>
  )
}
