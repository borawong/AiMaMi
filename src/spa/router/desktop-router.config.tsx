/**
 * 中文职责说明：桌面端路由表集中声明 path、element、redirect、error boundary、meta 和 skeleton。
 */
import { Suspense } from "react";
import { Navigate, type RouteObject, useOutletContext } from "react-router-dom";
import { PageStage } from "@/components/layout/page-stage";
import type { Route } from "@/types/navigation";
import { getRouteMeta } from "@/routes/registry/route-meta";
import {
  resolveRouteDefinition,
  resolveRoutePath,
  routeDefinitions,
  type RouteRenderContext,
} from "@/routes/registry/route-registry";
import { AppRouterShell } from "@/app/router/app-shell";

function RegistryRouteElement({ route }: { route: Route }) {
  const context = useOutletContext<RouteRenderContext>();
  const definition = resolveRouteDefinition(route);
  const HighIoFeedback = definition.HighIoFeedback;
  const Layout = definition.layout;
  const RouteErrorBoundary = definition.ErrorBoundary;

  if (definition.redirect) {
    return <Navigate to={resolveRoutePath(definition.redirect)} replace />;
  }

  return (
    <PageStage state="active" fillHeight={definition.fillHeight}>
      <Layout route={route}>
        <RouteErrorBoundary route={route}>
          {definition.highIo && <HighIoFeedback route={route} />}
          <Suspense fallback={definition.skeleton}>
            {definition.render(context)}
          </Suspense>
        </RouteErrorBoundary>
      </Layout>
    </PageStage>
  );
}

export const desktopRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppRouterShell />,
    children: [
      {
        index: true,
        element: <Navigate to={resolveRoutePath("overview")} replace />,
      },
      ...routeDefinitions.map((definition): RouteObject => ({
        id: definition.route,
        path: definition.path.slice(1),
        element: <RegistryRouteElement route={definition.route} />,
        handle: {
          meta: getRouteMeta(definition.route),
        },
      })),
    ],
  },
];
