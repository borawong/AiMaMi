"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

// Toast 是「系统级即时反馈」，必须高于所有可能挡住它的覆层。
// 现有 stack 梯度：Tooltip/Drawer/Sheet 50 < Popover 100 < Dialog/AlertDialog 200 < Select 300。
// 用 400 高于所有梯度，并留出 100 缓冲给未来潜在层级。
// 历史 bug：曾设为 110，导致在 Dialog（z=200，含遮罩）打开时点击触发的 toast 被遮罩盖住看不到。
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "pointer-events-none fixed left-1/2 top-[calc(3rem+4px-20px)] z-[400] flex max-h-screen w-[min(100vw-1.5rem,28rem)] -translate-x-1/2 flex-col items-center gap-2 p-0",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "toast-surface-motion group pointer-events-auto relative flex w-fit max-w-full min-w-0 flex-col overflow-hidden rounded-[12px] border-[0.5px] border-border bg-card shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-[12px] backdrop-saturate-[1.4] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
        success: "",
        warning: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const dotColorMap: Record<string, string> = {
  default:
    "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.45)] dark:shadow-[0_0_8px_hsl(var(--primary)/0.35)]",
  success: "bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.500)]",
  warning: "bg-amber-500 shadow-[0_0_6px_theme(colors.amber.500)]",
  destructive: "bg-red-500 shadow-[0_0_6px_theme(colors.red.500)]",
}

const progressBarMap: Record<string, string> = {
  default: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  destructive: "bg-red-500",
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants> & {
      /** ms; bottom bar animates for this length. Omit to hide bar. */
      duration?: number
    }
>(({ className, variant, duration, style, children, ...props }, ref) => {
  const barClass = progressBarMap[variant ?? "default"] ?? progressBarMap.default
  const dur = duration ?? 3000
  const showBar = dur > 0

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      style={
        {
          ...style,
          "--toast-duration": `${dur}ms`,
        } as React.CSSProperties
      }
      {...props}
    >
      <div className="relative flex w-full min-w-0 flex-1 items-start gap-2.5 px-3.5 py-2.5 pr-9">
        {children}
      </div>
      {showBar && (
        <div
          className="pointer-events-none h-[3px] w-full shrink-0 overflow-hidden bg-muted/60 dark:bg-white/10"
          aria-hidden
        >
          <div
            className={cn("toast-dismiss-progress h-full w-full", barClass)}
          />
        </div>
      )}
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastDot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: string | null }
>(({ variant, className, ...props }, ref) => {
  const color = dotColorMap[variant ?? "default"]
  return (
    <div
      ref={ref}
      className={cn("h-2 w-2 shrink-0 rounded-full", color, className)}
      {...props}
    />
  )
})
ToastDot.displayName = "ToastDot"

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-[8px] border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2.5 top-1/2 -translate-y-1/2 flex h-[18px] w-[18px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3 w-3" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-[13px] font-medium leading-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      "mt-[2px] text-[11px] text-muted-foreground leading-tight",
      className
    )}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastDot,
}
