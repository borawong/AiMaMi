import { cn } from "@/lib/utils";

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: string;
  compact?: boolean;
}

export function BentoCard({
  className,
  children,
  glowColor,
  compact,
  ...props
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card",
        "shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
        compact ? "p-4" : "p-6",
        className,
      )}
      {...props}
    >
      {glowColor && (
        <div
          className={cn(
            "pointer-events-none absolute -mr-16 -mt-16 right-0 top-0 h-48 w-48 rounded-full opacity-40 blur-3xl",
            glowColor,
          )}
        />
      )}
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
}
