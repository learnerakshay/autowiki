import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { AlertCircle, CheckCircle2, CircleEllipsis, Info } from 'lucide-react'
import { Badge } from './ui/badge.jsx'
import { cn } from '../lib/utils.js'

const statusConfig = {
  pending: { icon: CircleEllipsis, variant: 'pending' },
  completed: { icon: CheckCircle2, variant: 'completed' },
  failed: { icon: AlertCircle, variant: 'failed' },
  neutral: { icon: Info, variant: 'neutral' },
}

export function JobStatus({ status = 'neutral', className, children }) {
  const ref = useRef(null)
  const { icon: Icon, variant } = statusConfig[status] ?? statusConfig.neutral

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(ref.current, { autoAlpha: 0.65, y: 3 }, { autoAlpha: 1, y: 0, duration: 0.16, ease: 'power3.out' })
    })
    media.add('(prefers-reduced-motion: reduce)', () => {
      gsap.fromTo(ref.current, { autoAlpha: 0.65 }, { autoAlpha: 1, duration: 0.12, ease: 'none' })
    })
    return () => media.revert()
  }, { dependencies: [status] })

  return (
    <Badge ref={ref} variant={variant} role="status" className={cn('min-h-7', className)}>
      <Icon aria-hidden="true" className="size-3.5" />
      {children}
    </Badge>
  )
}
