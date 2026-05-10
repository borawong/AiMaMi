import { cn } from "@/lib/utils";

const colorMap = {
  blue: "bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/20",
  emerald:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  amber:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  red: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  gray: "bg-muted text-muted-foreground border-border",
} as const;

interface LabelBadgeProps {
  children: React.ReactNode;
  color?: keyof typeof colorMap;
  className?: string;
}

export function LabelBadge({
  children,
  color = "gray",
  className,
}: LabelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none",
        colorMap[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
