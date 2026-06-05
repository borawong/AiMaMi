/*
Restoration tier: P2
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-contract-report.md; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-control-flow.jsonl
Frontend module: app/main window shell
This file preserves the current shell and routes pages through reconstructed module boundaries.
*/
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useUpdateCheck } from "@/hooks/use-update-check";
import { useDeferredReady } from "@/hooks/use-deferred-ready";
import { useRouteTransition } from "@/hooks/use-route-transition";
import { PageStage } from "@/components/layout/page-stage";
import {
  AppSidebar,
  appNavItems,
  SIDEBAR_COLLAPSED_WIDTH_PX,
  SIDEBAR_EXPANDED_WIDTH_PX,
} from "@/components/layout/sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { UpdateOverlay } from "@/components/update/update-overlay";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createAppQueryClient } from "@/lib/query-client";
import { api } from "@/lib/api";
import { isMacPlatform } from "@/lib/platform";
import { ALL_APP_ROUTES, type Route } from "@/types/navigation";
import "./lib/i18n";

const OverviewRoute = lazy(() =>
  import("@/routes/desktop/main/overview").then((module) => ({ default: module.OverviewRoute })),
);
const AccountsRoute = lazy(() =>
  import("@/routes/desktop/main/accounts").then((module) => ({ default: module.AccountsRoute })),
);
const SessionsRoute = lazy(() =>
  import("@/routes/desktop/main/sessions").then((module) => ({ default: module.SessionsRoute })),
);
const AnalyticsRoute = lazy(() =>
  import("@/routes/desktop/main/analytics").then((module) => ({ default: module.AnalyticsRoute })),
);
const CustomInstructionsRoute = lazy(() =>
  import("@/routes/desktop/main/custom-instructions").then((module) => ({ default: module.CustomInstructionsRoute })),
);
const McpRoute = lazy(() =>
  import("@/routes/desktop/main/mcp").then((module) => ({ default: module.McpRoute })),
);
const SkillsRoute = lazy(() =>
  import("@/routes/desktop/main/skills").then((module) => ({ default: module.SkillsRoute })),
);
const RelayRoute = lazy(() =>
  import("@/routes/desktop/main/relay").then((module) => ({ default: module.RelayRoute })),
);
const SettingsRoute = lazy(() =>
  import("@/routes/desktop/main/settings").then((module) => ({ default: module.SettingsRoute })),
);
const MaintenanceRoute = lazy(() =>
  import("@/routes/desktop/main/maintenance").then((module) => ({ default: module.MaintenanceRoute })),
);
const DaemonAutoswitchRoute = lazy(() =>
  import("@/routes/desktop/main/daemon-autoswitch").then((module) => ({ default: module.DaemonAutoswitchRoute })),
);
const TrayShellRoute = lazy(() =>
  import("@/routes/desktop/main/tray-shell").then((module) => ({ default: module.TrayShellRoute })),
);
const VoiceRoute = lazy(() =>
  import("@/routes/desktop/main/voice").then((module) => ({ default: module.VoiceRoute })),
);

const DRAG_REGION_HEIGHT = isMacPlatform() ? 48 : 0;
const queryClient = createAppQueryClient();

export function MainAppRoot() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <MainApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function MainApp() {
  const [route, setRoute] = useState<Route>("overview");
  const { theme, setTheme } = useTheme();
  const { accent, setAccent, heatmap, setHeatmap } = useAccentColor();
  const { i18n, t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem("sidebar_collapsed") === "false",
  );
  const { refreshInterval, setRefreshInterval } = useAutoRefresh();
  const update = useUpdateCheck();
  const showUpdateOverlay =
    update.status === "available" ||
    update.status === "downloading" ||
    update.status === "installing" ||
    update.status === "error";

  const installLocationPrompt = useInstallLocationPrompt();
  const routeTransition = useRouteTransition(route, { durationMs: 240 });

  const handleThemeChange = useCallback((nextTheme: "light" | "dark" | "system") => {
    setTheme(nextTheme);
  }, [setTheme]);

  const prewarmRoutes = useDeferredReady(900);
  useEffect(() => {
    if (prewarmRoutes) {
      void Promise.allSettled([
        import("@/routes/desktop/main/overview"),
        import("@/routes/desktop/main/accounts"),
        import("@/routes/desktop/main/sessions"),
        import("@/routes/desktop/main/analytics"),
        import("@/routes/desktop/main/custom-instructions"),
        import("@/routes/desktop/main/mcp"),
        import("@/routes/desktop/main/skills"),
        import("@/routes/desktop/main/relay"),
        import("@/routes/desktop/main/settings"),
        import("@/routes/desktop/main/maintenance"),
        import("@/routes/desktop/main/daemon-autoswitch"),
        import("@/routes/desktop/main/tray-shell"),
        import("@/routes/desktop/main/voice"),
      ]);
    }
  }, [prewarmRoutes]);

  const renderPage = (targetRoute: Route): ReactElement => {
    switch (targetRoute) {
      case "overview":
        return <OverviewRoute />;
      case "accounts":
        return <AccountsRoute />;
      case "sessions":
        return <SessionsRoute />;
      case "analytics":
        return <AnalyticsRoute />;
      case "mcp":
        return <McpRoute />;
      case "skills":
        return <SkillsRoute />;
      case "custom-instructions":
        return <CustomInstructionsRoute />;
      case "relay":
        return <RelayRoute />;
      case "maintenance":
        return <MaintenanceRoute />;
      case "daemon-autoswitch":
        return <DaemonAutoswitchRoute />;
      case "tray-shell":
        return <TrayShellRoute />;
      case "voice":
        return <VoiceRoute />;
      case "settings":
        return (
          <SettingsRoute
            theme={theme}
            onThemeChange={handleThemeChange}
            accent={accent}
            setAccent={setAccent}
            heatmap={heatmap}
            setHeatmap={setHeatmap}
            language={i18n.language}
            setLanguage={(lang) => {
              i18n.changeLanguage(lang);
              localStorage.setItem("app_language", lang);
            }}
            refreshInterval={refreshInterval}
            setRefreshInterval={setRefreshInterval}
            onCheckUpdate={update.checkForUpdate}
          />
        );
      default:
        return <OverviewRoute />;
    }
  };

  const activeNavItem = appNavItems.find((item) => item.route === route);
  const routeTitle = activeNavItem
    ? t(activeNavItem.labelKey, { defaultValue: activeNavItem.fallbackLabel })
    : t("nav.overview", { defaultValue: "Overview" });

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
          onNavigate={setRoute}
          onThemeChange={handleThemeChange}
        />
        <SidebarInset className="max-h-screen overflow-hidden">
          <SiteHeader title={routeTitle} />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {ALL_APP_ROUTES
              .filter((candidate) => routeTransition.mountedRoutes.includes(candidate))
              .map((candidate) => (
                <PageStage
                  key={candidate}
                  state={routeTransition.getStage(candidate)}
                >
                  <Suspense fallback={<PageShellSkeleton />}>
                    {renderPage(candidate)}
                  </Suspense>
                </PageStage>
              ))}
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Toaster />
      <InstallLocationPromptDialog prompt={installLocationPrompt} />
      {showUpdateOverlay && !installLocationPrompt.open && (
        <UpdateOverlay
          status={update.status as "checking" | "available" | "downloading" | "installing" | "error"}
          currentVersion={update.updateInfo?.currentVersion ?? "0.0.0"}
          newVersion={update.updateInfo?.version}
          body={update.updateInfo?.body}
          progress={update.progress}
          error={update.error}
          onInstall={update.installUpdate}
          onRetry={update.checkForUpdate}
          onSkip={update.dismiss}
        />
      )}
    </div>
  );
}

function useInstallLocationPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void api
      .checkUpdateInstallability()
      .then((payload) => {
        if (cancelled) return;
        if (payload.code === "app_translocation" || payload.code === "read_only_location") {
          setOpen(true);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => setOpen(false);

  const openApplications = async () => {
    await api.openPath("/Applications");
    setOpen(false);
  };

  return {
    open,
    dismiss,
    openApplications,
  };
}

function InstallLocationPromptDialog({
  prompt,
}: {
  prompt: ReturnType<typeof useInstallLocationPrompt>;
}) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={prompt.open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("update.installPromptTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("update.installPromptDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={prompt.dismiss}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={prompt.openApplications}>
            {t("update.openApplications")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PageShellSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between border-b border-border/60 pb-4 last:border-b-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
