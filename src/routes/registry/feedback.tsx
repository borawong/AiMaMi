import { useIsFetching } from "@tanstack/react-query";
import type { Route } from "@/types/navigation";

export function RouteHighIoFeedback({ route }: { route: Route }) {
  const fetchingCount = useIsFetching({ queryKey: [route] });

  if (fetchingCount === 0) {
    return null;
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-5 top-4 z-10 h-2 w-2 rounded-full bg-primary/70 shadow-sm"
    />
  );
}
