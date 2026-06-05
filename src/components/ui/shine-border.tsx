import * as React from "react";

import { cn } from "@/lib/utils";

export interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 边框厚度，单位 px，@default 1 */
  borderWidth?: number;
  /** 动画时长，单位秒，@default 14 */
  duration?: number;
  /** 实色或渐变色标数组 */
  shineColor?: string | string[];
}

/**
 * 动态边框高光。
 */
export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = "#000000",
  className,
  style,
  ...props
}: ShineBorderProps) {
  const gradientStops = Array.isArray(shineColor) ? shineColor.join(",") : shineColor;

  return (
    <div
      data-shine-border=""
      style={
        {
          "--border-width": `${borderWidth}px`,
          backgroundImage: `radial-gradient(transparent,transparent, ${gradientStops},transparent,transparent)`,
          backgroundSize: "300% 300%",
          mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "var(--border-width)",
          animation: `shine ${duration}s linear infinite`,
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 size-full rounded-[inherit] will-change-[background-position]",
        className,
      )}
      {...props}
    />
  );
}
