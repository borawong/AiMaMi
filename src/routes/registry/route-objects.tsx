/**
 * 中文职责说明：由 route registry 生成 React Router 路由对象，集中持有 route、layout、错误边界、meta、redirect、skeleton 和 fill-height。
 */
import { Suspense } from "react";
import {
  Navigate,
  createHashRouter,
  type RouteObject,
  useOutletContext,
} from "react-router-dom";
import { PageStage } from "@/components/layout/page-stage";
import { AppRouterShell } from "@/app/router/app-shell";
import type { Route } from "@/types/navigation";
import { getRouteMeta } from "@/routes/registry/route-meta";
import {
  resolveRouteDefinition,
  resolveRoutePath,
  routeDefinitions,
  type RouteRenderContext,
} from "@/routes/registry/route-registry";
import { RouteShellSkeleton } from "@/routes/registry/route-skeletons";

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

function RouteRegistryRouterErrorElement() {
  return <RouteShellSkeleton />;
}

export const registryRouteObjects: RouteObject[] = [
  {
    path: "/",
    element: <AppRouterShell />,
    errorElement: <RouteRegistryRouterErrorElement />,
    children: [
      {
        index: true,
        element: <Navigate to={resolveRoutePath("overview")} replace />,
      },
      ...routeDefinitions.map((definition): RouteObject => ({
        id: definition.route,
        path: definition.path.slice(1),
        element: <RegistryRouteElement route={definition.route} />,
        errorElement: <RouteRegistryRouterErrorElement />,
        handle: {
          meta: getRouteMeta(definition.route),
        },
      })),
    ],
  },
];

export function createRegistryRouter() {
  return createHashRouter(registryRouteObjects);
}
