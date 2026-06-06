/**
 * 中文职责说明：settings 面板基础布局只负责模块内展示骨架，不持有服务端事实状态。
 */
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AnimatedSegmentedControl } from "@/components/ui/animated-segmented-control";
import { BentoCard } from "@/components/ui/bento-card";
import { cn } from "@/lib/utils";

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h2 className="px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <BentoCard className="p-0 [&>div]:divide-y [&>div]:divide-border">{children}</BentoCard>
    </div>
  );
}

export function SettingsRow({
  label,
  description,
  children,
}: {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <span className="text-[13px] font-medium">{label}</span>
        {description ? (
          <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function SettingsSegmentedControl({
  items,
  value,
  onChange,
  compact = false,
}: {
  items: {
    value: string;
    icon?: LucideIcon;
    label: string;
  }[];
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("rounded-full bg-muted p-0.5 dark:bg-white/[0.06]")}>
      <AnimatedSegmentedControl
        items={items}
        value={value}
        onValueChange={(nextValue) => onChange(nextValue)}
        className="gap-0.5"
        indicatorClassName="rounded-full bg-white shadow-sm dark:bg-white/[0.10]"
        itemClassName={cn(
          "rounded-full whitespace-nowrap text-xs font-medium [&_svg]:h-3.5 [&_svg]:w-3.5",
          compact ? "px-2.5 py-1.5" : "gap-1.5 px-3 py-1.5",
        )}
        activeItemClassName="text-foreground"
        inactiveItemClassName="text-muted-foreground hover:text-foreground"
      />
    </div>
  );
}
