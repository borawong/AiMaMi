"use client"

import { useToast } from "@/hooks/toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastDot,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        duration,
        ...props
      }) {
        return (
          <Toast key={id} variant={variant} duration={duration} {...props}>
            <div className="flex h-[1.125rem] shrink-0 items-center self-start">
              <ToastDot variant={variant ?? "default"} />
            </div>
            <div className="min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
