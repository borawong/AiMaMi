import type { ReactElement } from "react";
import {
  createHashRouter,
  isRouteErrorResponse,
  useRouteError,
  type RouteObject,
} from "react-router-dom";
import { ErrorBoundary } from "@/components/boundary";
import { RouteShellSkeleton } from "@/routes/registry/skeletons";

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
