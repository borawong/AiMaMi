/**
 * 中文职责说明：应用路由壳只消费 route registry，负责当前 route、布局装配和模块 shell 挂载。
 */
import { Suspense, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { Route } from "@/types/navigation";
import { PageStage } from "@/components/layout/page-stage";
import {
  AppSidebar,
  SIDEBAR_COLLAPSED_WIDTH_PX,
  SIDEBAR_EXPANDED_WIDTH_PX,
} from "@/components/layout/sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useDeferredReady } from "@/hooks/use-deferred-ready";
import { useRouteTransition } from "@/hooks/use-route-transition";
import { useTheme } from "@/hooks/use-theme";
import { isMacPlatform } from "@/lib/platform";
import { usePromptHostActions } from "@/app/runtime/prompt-host";
import { getRouteMeta, getVisibleRouteMeta } from "@/routes/registry/route-meta";
import { preloadVisibleRoutes } from "@/routes/registry/route-preload";
import { resolveRouteDefinition } from "@/routes/registry/route-registry";

const DRAG_REGION_HEIGHT = isMacPlatform() ? 48 : 0;

export function AppRouter() {
  const [route, setRoute] = useState<Route>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem("sidebar_collapsed") === "false",
  );
  const { theme, setTheme } = useTheme();
  const { accent, setAccent, heatmap, setHeatmap } = useAccentColor();
  const { i18n } = useTranslation();
  const { refreshInterval, setRefreshInterval } = useAutoRefresh();
  const { checkForUpdate } = usePromptHostActions();
  const routeTransition = useRouteTransition(route, { durationMs: 240 });
  const activeRouteMeta = getRouteMeta(route);
  const visibleRouteMeta = useMemo(() => getVisibleRouteMeta(), []);
  const prewarmRoutes = useDeferredReady(900);

  const handleThemeChange = useCallback(
    (nextTheme: "light" | "dark" | "system") => {
      setTheme(nextTheme);
    },
    [setTheme],
  );

  useEffect(() => {
    if (prewarmRoutes) {
      void preloadVisibleRoutes();
    }
  }, [prewarmRoutes]);

  useEffect(() => {
    const redirect = resolveRouteDefinition(route).redirect;
    if (redirect) {
      setRoute(redirect);
    }
  }, [route]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] dark:bg-background">
      <div
        className="fixed inset-x-0 top-0 z-[60]"
        data-tauri-drag-region
        style={{ WebkitAppRegion: "drag", height: DRAG_REGION_HEIGHT } as CSSProperties}
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
          activeRoute={route}
          routeItems={visibleRouteMeta}
          onNavigate={setRoute}
          onThemeChange={handleThemeChange}
        />
        <SidebarInset className="max-h-screen overflow-hidden">
          <SiteHeader routeMeta={activeRouteMeta} />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {visibleRouteMeta
              .filter((candidate) => routeTransition.mountedRoutes.includes(candidate.route))
              .map((candidate) => {
                const definition = resolveRouteDefinition(candidate.route);
                const HighIoFeedback = definition.HighIoFeedback;
                const Layout = definition.layout;
                const RouteErrorBoundary = definition.ErrorBoundary;

                return (
                  <PageStage
                    key={candidate.route}
                    state={routeTransition.getStage(candidate.route)}
                    fillHeight={definition.fillHeight}
                  >
                    <Layout route={candidate.route}>
                      <RouteErrorBoundary route={candidate.route}>
                        {definition.highIo && <HighIoFeedback route={candidate.route} />}
                        <Suspense fallback={definition.skeleton}>
                          {definition.render({
                            settings: {
                              theme,
                              onThemeChange: handleThemeChange,
                              accent,
                              setAccent,
                              heatmap,
                              setHeatmap,
                              language: i18n.language,
                              setLanguage: (lang: string) => {
                                void i18n.changeLanguage(lang);
                                localStorage.setItem("app_language", lang);
                              },
                              refreshInterval,
                              setRefreshInterval,
                              onCheckUpdate: checkForUpdate,
                            },
                          })}
                        </Suspense>
                      </RouteErrorBoundary>
                    </Layout>
                  </PageStage>
                );
              })}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
