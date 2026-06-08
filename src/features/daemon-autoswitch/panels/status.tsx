import { cn } from "@/lib/utils";
import type { DaemonAutoswitchQueryState } from "../types";

export function DaemonStatusLine({ state }: { state: DaemonAutoswitchQueryState }) {
  if (!state.isLoading && !state.isError && !state.isFetching) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "block h-3 w-16 rounded-[3px] bg-muted",
        state.isFetching && "animate-pulse",
        state.isError && "bg-destructive/20",
      )}
    />
  );
}
