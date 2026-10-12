import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '../../lib/utils.js'

export function Label({ className, ...props }) {
  return <LabelPrimitive.Root className={cn('text-sm font-semibold leading-none text-foreground', className)} {...props} />
}
