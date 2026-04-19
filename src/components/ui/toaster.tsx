'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      duration={5000}
      richColors
      closeButton={false}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        },
      }}
      {...props}
    />
  )
}
