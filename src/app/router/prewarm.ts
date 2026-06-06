import { useEffect } from "react";
import { useDeferredReady } from "@/hooks/deferred";
import { preloadVisibleRoutes } from "@/routes/registry/preload";

export function useRoutePrewarm() {
  const prewarmRoutes = useDeferredReady(900);

  useEffect(() => {
    if (prewarmRoutes) {
      void preloadVisibleRoutes();
    }
  }, [prewarmRoutes]);
}
