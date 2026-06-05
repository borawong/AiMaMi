/**
 * 中文职责说明：路由工具只封装 Router 实例创建和 chunk 错误边界，不承载模块业务状态。
 */
import type { ReactElement } from "react";
import {
  createHashRouter,
  isRouteErrorResponse,
  useRouteError,
  type RouteObject,
} from "react-router-dom";
import { ErrorBoundary } from "@/components/error-boundary";
import { RouteShellSkeleton } from "@/routes/registry/route-skeletons";

export function createAppRouter(routes: RouteObject[]) {
  return createHashRouter(routes);
}

export function dynamicElement(element: ReactElement) {
  return element;
}

export function dynamicLayout(element: ReactElement) {
  return element;
}

export function RouterErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : undefined;

  return (
    <ErrorBoundary fallback={<RouteShellSkeleton />}>
      <div className="p-6 text-sm text-destructive">
        {message ?? "路由加载失败"}
      </div>
    </ErrorBoundary>
  );
}
