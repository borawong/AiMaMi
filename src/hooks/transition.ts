import { useCallback, useEffect, useRef, useState } from "react";

type RouteStage = "active" | "exiting" | "idle";

interface UseRouteTransitionOptions {
  durationMs?: number;
}

export function useRouteTransition<T extends string>(
  route: T,
  options?: UseRouteTransitionOptions,
) {
  const durationMs = options?.durationMs ?? 240;
  const previousRouteRef = useRef(route);
  const [mountedRoutes, setMountedRoutes] = useState<T[]>([route]);
  const [exitingRoute, setExitingRoute] = useState<T | null>(null);

  useEffect(() => {
    setMountedRoutes((prev) => (prev.includes(route) ? prev : [...prev, route]));
  }, [route]);

  useEffect(() => {
    const previous = previousRouteRef.current;
    if (previous === route) return;

    setMountedRoutes((prev) => (prev.includes(previous) ? prev : [...prev, previous]));
    setExitingRoute(previous);
    previousRouteRef.current = route;

    const timeoutId = window.setTimeout(() => {
      setExitingRoute((current) => (current === previous ? null : current));
    }, durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [durationMs, route]);

  const getStage = useCallback(
    (candidate: T): RouteStage => {
      if (candidate === route) return "active";
      if (candidate === exitingRoute) return "exiting";
      return "idle";
    },
    [exitingRoute, route],
  );

  return {
    mountedRoutes,
    getStage,
  };
}
