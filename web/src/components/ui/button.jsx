import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils.js'

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 outline-none active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary px-4 text-primary-foreground hover:border-primary-hover hover:bg-primary-hover',
        secondary: 'border-border-strong bg-background px-4 text-foreground hover:border-primary/45 hover:bg-accent-soft hover:text-primary-hover',
        ghost: 'border-transparent bg-transparent px-3 text-muted-foreground shadow-none hover:bg-muted hover:text-foreground',
      },
      size: {
        default: 'h-11',
        sm: 'h-9 min-h-9 px-3 text-xs',
        icon: 'size-11 px-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

