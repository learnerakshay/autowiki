import { cn } from '../../lib/utils.js'

export function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={cn('flex h-11 w-full rounded-lg border border-border-strong bg-background px-3.5 text-[0.9375rem] text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground hover:border-foreground/45 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground', className)}
      {...props}
    />
  )
}
