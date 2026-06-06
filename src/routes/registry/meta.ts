/**
 * 中文职责说明：从 route registry 派生导航和标题 meta，供 sidebar、header 和页面标题共同消费。
 */
import type { LucideIcon } from "lucide-react";
import type { Route } from "@/types/navigation";
import { resolveRouteDefinition, routeDefinitions } from "@/routes/registry/registry";

export interface RouteMeta {
  route: Route;
  path: `/${string}`;
  titleKey: string;
  icon: LucideIcon;
  visible: boolean;
  redirect: Route | null;
  fillHeight: boolean;
  highIo: boolean;
}

function toRouteMeta(definition: (typeof routeDefinitions)[number]): RouteMeta {
  return {
    route: definition.route,
    path: definition.path,
    titleKey: definition.titleKey,
    icon: definition.icon,
    visible: definition.visible,
    redirect: definition.redirect,
    fillHeight: definition.fillHeight,
    highIo: definition.highIo,
  };
}

export function getRouteMeta(route: Route): RouteMeta {
  return toRouteMeta(resolveRouteDefinition(route));
}

export function getVisibleRouteMeta(): RouteMeta[] {
  return routeDefinitions.filter((definition) => definition.visible).map(toRouteMeta);
}
