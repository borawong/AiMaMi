/**
 * 中文职责说明：应用路由壳只装配全局布局、导航 meta、预加载和 Outlet 上下文，不拥有模块业务流程。
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppSidebar,
  SIDEBAR_COLLAPSED_WIDTH_PX,
  SIDEBAR_EXPANDED_WIDTH_PX,
} from "@/components/layout/sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useRouteRenderSettings } from "@/app/providers/route-settings-provider";
import { useDeferredReady } from "@/hooks/use-deferred-ready";
import { isMacPlatform } from "@/lib/platform";
import { getRouteMeta, getVisibleRouteMeta } from "@/routes/registry/route-meta";
import { preloadVisibleRoutes } from "@/routes/registry/route-preload";
import {
  resolveRouteFromPath,
  resolveRoutePath,
  type RouteRenderContext,
} from "@/routes/registry/route-registry";
import type { Route } from "@/types/navigation";

const DRAG_REGION_HEIGHT = isMacPlatform() ? 48 : 0;

export function AppRouterShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem("sidebar_collapsed") === "false",
  );
  const settings = useRouteRenderSettings();
  const activeRoute = resolveRouteFromPath(location.pathname);
  const activeRouteMeta = getRouteMeta(activeRoute);
  const visibleRouteMeta = useMemo(() => getVisibleRouteMeta(), []);
  const prewarmRoutes = useDeferredReady(900);

  const handleNavigate = useCallback(
    (nextRoute: Route) => {
      navigate(resolveRoutePath(nextRoute));
    },
    [navigate],
  );

  const routeContext = useMemo<RouteRenderContext>(
    () => ({
      settings,
    }),
    [settings],
  );

  useEffect(() => {
    if (prewarmRoutes) {
      void preloadVisibleRoutes();
    }
  }, [prewarmRoutes]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] dark:bg-background">
      <div
        className="fixed inset-x-0 top-0 z-[60]"
        data-tauri-drag-region
        style={
          {
            WebkitAppRegion: "drag",
            height: DRAG_REGION_HEIGHT,
          } as CSSProperties
        }
      />

      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={(open) => {
          setSidebarOpen(open);
          localStorage.setItem("sidebar_collapsed", String(!open));
        }}
        style={
          {
            "--sidebar-width": `${SIDEBAR_EXPANDED_WIDTH_PX}px`,
            "--sidebar-width-icon": `${SIDEBAR_COLLAPSED_WIDTH_PX}px`,
          } as CSSProperties
        }
        className="flex min-h-0 flex-1 overflow-hidden"
      >
        <AppSidebar
          activeRoute={activeRoute}
          routeItems={visibleRouteMeta}
          onNavigate={handleNavigate}
          onThemeChange={settings.onThemeChange}
        />
        <SidebarInset className="max-h-screen overflow-hidden">
          <SiteHeader routeMeta={activeRouteMeta} />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <Outlet context={routeContext} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
