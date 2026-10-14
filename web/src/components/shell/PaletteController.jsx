import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { whenIdle, cancelIdle } from '../../lib/idle.js'
import { useLocation } from 'react-router-dom'

import { prefetchPalette } from '../../lib/palette.js'
const CommandPalette = lazy(prefetchPalette)
const Toaster = lazy(() => import('../ui/kit/toast.jsx').then((module) => ({ default: module.Toaster })))
export function PaletteController() {
  const [open, setOpen] = useState(false)
  const [activated, setActivated] = useState(false)
  const { pathname } = useLocation()
  if (pathname !== '/' && !activated) setActivated(true)
  const openRef = useRef(open)
  useLayoutEffect(() => { openRef.current = open }, [open])
  const triggerRef = useRef(null)
  useEffect(() => {
    const launch = () => { if (openRef.current) return; triggerRef.current = document.activeElement; setActivated(true); setOpen(true) }
    const shortcut = (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); launch() } }
    window.addEventListener('autowiki:palette', launch)
    document.addEventListener('keydown', shortcut)
    let idle
    const timer = setTimeout(() => { idle = whenIdle(() => void prefetchPalette().catch(() => {}), 3000) }, 5000)
    return () => { clearTimeout(timer); cancelIdle(idle); window.removeEventListener('autowiki:palette', launch); document.removeEventListener('keydown', shortcut) }
  }, [])
  return <>{open ? <Suspense fallback={null}><CommandPalette open={open} onOpenChange={setOpen} triggerRef={triggerRef} /></Suspense> : null}{activated && !pathname.startsWith('/dev/') ? <Suspense fallback={null}><Toaster /></Suspense> : null}</>
}
