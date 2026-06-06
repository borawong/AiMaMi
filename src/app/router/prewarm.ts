/**
 * 中文职责说明：路由预热 hook 只根据全局空闲时机调度 route registry 的预加载。
 */
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
