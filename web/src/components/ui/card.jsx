import { cn } from '../../lib/utils.js'

export function Card({ className, ...props }) {
  return <div className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgba(23,32,51,0.04)]', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1.5 p-5 sm:p-6', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn('text-lg font-semibold tracking-[-0.02em]', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center gap-3 p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
}
