import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils.js'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }) {
  return <TabsPrimitive.List className={cn('flex', className)} {...props} />
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn('min-h-11 rounded-lg border border-transparent px-3.5 text-left text-sm font-medium text-muted-foreground outline-none transition-[color,background-color,border-color,box-shadow,transform] hover:border-border hover:bg-background hover:text-foreground active:translate-y-px disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary/20 data-[state=active]:bg-accent-soft data-[state=active]:font-semibold data-[state=active]:text-primary-hover', className)}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn('outline-none', className)} {...props} />
}
