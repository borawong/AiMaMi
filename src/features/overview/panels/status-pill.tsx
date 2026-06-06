import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatusPill({
  ok,
  loading,
  children,
}: {
  ok: boolean;
  loading: boolean;
  children: ReactNode;
}) {
  if (loading) {
    return <span className="inline-flex h-5 w-24 animate-pulse rounded-full bg-muted" />;
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-[160px] items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        ok ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive",
      )}
    >
      <span
        className={cn(
          "h-[5px] w-[5px] shrink-0 rounded-full bg-current",
          ok
            ? "shadow-[0_0_0_2px_rgba(16,185,129,0.2)]"
            : "shadow-[0_0_0_2px_rgba(239,68,68,0.2)]",
        )}
      />
      <span className="truncate">{children}</span>
    </span>
  );
}
