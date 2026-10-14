import { useEffect, useRef } from 'react'
import { WifiOff } from 'lucide-react'
import { Button, Surface } from '../ui/kit/index.js'
import { toast } from '../ui/kit/toastStore.js'
import { useSpringReveal } from '../ui/kit/hooks.js'
import './offline.css'

export default function OfflineBanner({ reason, onDismiss }) {
  const ref = useRef(null)
  const previous = useRef(reason)
  useSpringReveal(ref, reason)
  useEffect(() => {
    if (previous.current && !reason) toast.info('Connection available', { key: 'connection', description: 'Retry failed status checks manually.' })
    previous.current = reason
  }, [reason])
  if (!reason) return null
  return <Surface ref={ref} className="offline-banner" role="status"><WifiOff aria-hidden="true" /><p><strong>{reason === 'offline' ? 'You are offline.' : 'The service could not be reached.'}</strong> Status checks may fail and can be retried manually.</p><Button size="sm" variant="ghost" onClick={() => { previous.current = ''; onDismiss() }}>Dismiss</Button></Surface>
}
