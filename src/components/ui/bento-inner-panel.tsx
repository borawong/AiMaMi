import { cn } from "@/lib/utils";

export function BentoInnerPanel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border p-4",
        "bg-muted/50 dark:bg-black/25",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
