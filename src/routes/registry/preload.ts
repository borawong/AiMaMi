/**
 * 中文职责说明：统一执行 route 预加载，预加载范围只来自 route registry。
 */
import type { Route } from "@/types/navigation";
import { resolveRouteDefinition, routeDefinitions } from "@/routes/registry/registry";

export function preloadRoute(route: Route) {
  return resolveRouteDefinition(route).preload();
}

export function preloadVisibleRoutes() {
  return Promise.allSettled(
    routeDefinitions
      .filter((definition) => definition.visible)
      .map((definition) => definition.preload()),
  );
}
