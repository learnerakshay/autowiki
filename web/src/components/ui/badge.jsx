import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils.js'

const badgeVariants = cva('inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold leading-none', {
  variants: {
    variant: {
      default: 'border-primary/20 bg-accent-soft text-primary-hover',
      pending: 'border-pending-border bg-pending-soft text-pending',
      completed: 'border-success-border bg-success-soft text-success',
      failed: 'border-danger-border bg-danger-soft text-danger',
      neutral: 'border-border bg-muted text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
