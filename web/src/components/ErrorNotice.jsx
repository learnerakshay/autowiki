import { AlertCircle } from 'lucide-react'
import { Card } from './ui/card.jsx'

export function ErrorNotice({ title, error, recovery }) {
  return (
    <Card className="max-w-3xl border-danger-border bg-danger-soft p-4 shadow-none" role="alert">
      <div className="flex gap-3">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
        <div>
          <p className="font-semibold text-danger">{title}: {error}</p>
          <p className="mt-1 text-sm leading-6 text-danger/85">{recovery}</p>
        </div>
      </div>
    </Card>
  )
}
