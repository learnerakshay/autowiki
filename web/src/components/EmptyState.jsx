import { Card } from './ui/card.jsx'

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <Card className="flex max-w-3xl items-start gap-4 border-dashed bg-surface-subtle p-5 shadow-none sm:p-6">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <h2 className="text-base font-semibold tracking-[-0.015em]">{title}</h2>
        <p className="mt-1 max-w-[62ch] text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </Card>
  )
}
