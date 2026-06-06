import { Suspense } from "react";
import {
  Navigate,
  createHashRouter,
  type RouteObject,
  useOutletContext,
} from "react-router-dom";
import { PageStage } from "@/components/layout/stage";
import { AppRouterShell } from "@/app/router/shell";
import type { Route } from "@/types/navigation";
import { getRouteMeta } from "@/routes/registry/meta";
import {
  resolveRouteDefinition,
  resolveRoutePath,
  routeDefinitions,
  type RouteRenderContext,
} from "@/routes/registry/registry";
import { RouteShellSkeleton } from "@/routes/registry/skeletons";

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
