import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button, Page, PageHeader, Surface } from '../components/ui/kit/index.js'
import { useSpringReveal } from '../components/ui/kit/hooks.js'

export default function NotFound() {
  const { pathname } = useLocation()
  const ref = useRef(null)
  useSpringReveal(ref, pathname)
  useEffect(() => { document.title = 'Page not found — AutoWiki'; ref.current?.querySelector('h1')?.focus({ preventScroll: true }) }, [])
  return <Page><Surface ref={ref}><PageHeader title="Page not found" lede="This address does not match an AutoWiki page." />{pathname.startsWith('/wiki') ? <p>Generated Wikis exist only while the server process lives. The current app cannot reopen a lost polling job from a local Wiki file.</p> : null}<div className="ui-actions">{[['Workspace', '/workspace'], ['Chat', '/chat'], ['Architecture', '/architecture'], ['Sample Wiki', '/wiki/sample/spoon-knife']].map(([label, to]) => <Button key={to} as={Link} variant="secondary" to={to} iconTrailing={ArrowRight}>{label}</Button>)}</div></Surface></Page>
}
