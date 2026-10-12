import { Toaster as Sonner } from 'sonner'

export function Toaster(props) {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'toast-surface',
          title: 'toast-title',
          description: 'toast-description',
        },
      }}
      {...props}
    />
  )
}
