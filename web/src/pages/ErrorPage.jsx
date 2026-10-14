import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Home, RefreshCw } from 'lucide-react'
import { Button, Page, PageHeader, Surface } from '../components/ui/kit/index.js'
import { BrandLink } from '../components/brand/BrandLink.jsx'
import { useSpringReveal } from '../components/ui/kit/hooks.js'

export default function ErrorPage({ id, root, chunk }) {
  const ref = useRef(null)
  useSpringReveal(ref, id)
  useEffect(() => { document.title = 'Page unavailable — AutoWiki'; ref.current?.querySelector('h1')?.focus({ preventScroll: true }) }, [id])
  const content = <Page><Surface ref={ref}>{root ? <BrandLink /> : null}<PageHeader title="This page could not be displayed" lede={chunk ? 'A page update could not be loaded. Reload to update.' : 'An interface error interrupted this page. Reload it or return home.'} /><p>Error reference: <code>{id}</code></p><div className="ui-actions"><Button iconLeading={RefreshCw} onClick={() => window.location.reload()}>{chunk ? 'Reload to update' : 'Reload'}</Button><Button as={Link} to="/" variant="secondary" iconLeading={Home}>Go home</Button></div></Surface></Page>
  return root ? <main id="main-content">{content}</main> : content
}
