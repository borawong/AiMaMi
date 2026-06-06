import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 5, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // 垂直内边距不对称（上 5 / 下 7）用于补偿字体度量在无额外行距时的视觉偏移：
        // 系统中文字体在 11px、行高为 1 时，字形在行框内**偏下**，
        // 上下严格 6/6 时视觉上字会偏下、上方留白显得大；改成 5/7 把字"挤"向上 1px 视觉居中。
        // 总高度不变（23px），只是上下内边距的分配变了。
        //
        // 层级：悬浮提示通过传送门挂到页面根节点，必须高于弹窗内容的栈（当前为 200），
        // 否则弹窗内悬停出来的提示会被弹窗浮层完全压住看不见。
        // 取 300 作为「顶层悬浮提示」常驻层，仍低于原生即时反馈和系统级覆层。
        "relative z-[300] max-w-sm overflow-visible rounded-[6px] px-2 pt-[5px] pb-[7px] text-[11px] font-medium leading-none",
        "box-border text-center",
        "bg-[hsl(var(--tooltip))] text-[hsl(var(--tooltip-foreground))]",
        "shadow-sm",
        "duration-150 animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-100",
        className
      )}
      {...props}
    >
      <span className="inline-flex min-h-[11px] w-full items-center justify-center">{children}</span>
      <TooltipPrimitive.Arrow
        className="fill-[hsl(var(--tooltip))]"
        width={11}
        height={5}
      />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
