import { lazy, type ComponentType, type ReactElement, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  FileCode2,
  Headphones,
  LayoutDashboard,
  MessageSquareText,
  Mic2,
  Puzzle,
  RadioTower,
  Server,
  Settings,
  Sparkles,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { SettingsRouteProps } from "@/routes/desktop/main/settings/page";
import type { Route } from "@/types/navigation";
import { RouteHighIoFeedback } from "@/routes/registry/feedback";
import { RouteShellSkeleton } from "@/routes/registry/skeletons";
import { ErrorBoundary } from "@/components/boundary";

const OverviewRoute = lazy(() =>
  import("@/routes/desktop/main/overview/page").then((module) => ({
    default: module.OverviewRoute,
  })),
);
const AccountsRoute = lazy(() =>
  import("@/routes/desktop/main/accounts/page").then((module) => ({
    default: module.AccountsRoute,
  })),
);
const SessionsRoute = lazy(() =>
  import("@/routes/desktop/main/sessions/page").then((module) => ({
    default: module.SessionsRoute,
  })),
);
const AnalyticsRoute = lazy(() =>
  import("@/routes/desktop/main/analytics/page").then((module) => ({
    default: module.AnalyticsRoute,
  })),
);
const CustomInstructionsRoute = lazy(() =>
  import("@/routes/desktop/main/custom-instructions/page").then((module) => ({
    default: module.CustomInstructionsRoute,
  })),
);
const McpRoute = lazy(() =>
  import("@/routes/desktop/main/mcp/page").then((module) => ({
    default: module.McpRoute,
  })),
);
const SkillsRoute = lazy(() =>
  import("@/routes/desktop/main/skills/page").then((module) => ({
    default: module.SkillsRoute,
  })),
);
const PluginsRoute = lazy(() =>
  import("@/routes/desktop/main/plugins/page").then((module) => ({
    default: module.PluginsRoute,
  })),
);
const RelayRoute = lazy(() =>
  import("@/routes/desktop/main/relay/page").then((module) => ({
    default: module.RelayRoute,
  })),
);
const SettingsRoute = lazy(() =>
  import("@/routes/desktop/main/settings/page").then((module) => ({
    default: module.SettingsRoute,
  })),
);
const MaintenanceRoute = lazy(() =>
  import("@/routes/desktop/main/maintenance/page").then((module) => ({
    default: module.MaintenanceRoute,
  })),
);
const DaemonAutoswitchRoute = lazy(() =>
  import("@/routes/desktop/main/daemon-autoswitch/page").then((module) => ({
    default: module.DaemonAutoswitchRoute,
  })),
);
const TrayShellRoute = lazy(() =>
  import("@/routes/desktop/main/tray-shell/page").then((module) => ({
    default: module.TrayShellRoute,
  })),
);
const VoiceRoute = lazy(() =>
  import("@/routes/desktop/main/voice/page").then((module) => ({
    default: module.VoiceRoute,
  })),
);

export interface RouteRenderContext {
  settings: SettingsRouteProps;
}

export interface RouteLayoutProps {
  route: Route;
  children: ReactNode;
}

export interface RouteErrorBoundaryProps {
  route: Route;
  children: ReactNode;
}

export interface RouteDefinition {
  route: Route;
  path: `/${string}`;
  titleKey: string;
  icon: LucideIcon;
  visible: boolean;
  layout: ComponentType<RouteLayoutProps>;
  ErrorBoundary: ComponentType<RouteErrorBoundaryProps>;
  redirect: Route | null;
  fillHeight: boolean;
  highIo: boolean;
  preload: () => Promise<unknown>;
  skeleton: ReactNode;
  HighIoFeedback: ComponentType<{ route: Route }>;
  render: (context: RouteRenderContext) => ReactElement;
}

type RouteDefinitionInput = Omit<
  RouteDefinition,
  "path" | "layout" | "ErrorBoundary" | "redirect" | "fillHeight"
> &
  Partial<Pick<RouteDefinition, "layout" | "ErrorBoundary" | "redirect" | "fillHeight">>;

function RouteRegistryLayout({ children }: RouteLayoutProps) {
  return <>{children}</>;
}

function RouteRegistryErrorBoundary({ children }: RouteErrorBoundaryProps) {
  return <ErrorBoundary fallback={<RouteShellSkeleton />}>{children}</ErrorBoundary>;
}

function withRouteDefaults(definition: RouteDefinitionInput): RouteDefinition {
  return {
    path: `/${definition.route}`,
    layout: RouteRegistryLayout,
    ErrorBoundary: RouteRegistryErrorBoundary,
    redirect: null,
    fillHeight: true,
    ...definition,
  };
}

export const routeDefinitions: RouteDefinition[] = ([
  {
    route: "overview",
    titleKey: "nav.overview",
    icon: LayoutDashboard,
    visible: true,
    highIo: false,
    preload: () => import("@/routes/desktop/main/overview/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <OverviewRoute />,
  },
  {
    route: "accounts",
    titleKey: "nav.accounts",
    icon: Users,
    visible: true,
    highIo: true,
    preload: () => import("@/routes/desktop/main/accounts/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <AccountsRoute />,
  },
  {
    route: "sessions",
    titleKey: "nav.sessions",
    icon: MessageSquareText,
    visible: true,
    highIo: true,
    preload: () => import("@/routes/desktop/main/sessions/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <SessionsRoute />,
  },
  {
    route: "analytics",
    titleKey: "nav.analytics",
    icon: BarChart3,
    visible: false,
    highIo: true,
    preload: () => import("@/routes/desktop/main/analytics/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <AnalyticsRoute />,
  },
  {
    route: "custom-instructions",
    titleKey: "nav.customInstructions",
    icon: FileCode2,
    visible: false,
    highIo: true,
    preload: () => import("@/routes/desktop/main/custom-instructions/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <CustomInstructionsRoute />,
  },
  {
    route: "mcp",
    titleKey: "nav.mcp",
    icon: Server,
    visible: true,
    highIo: true,
    preload: () => import("@/routes/desktop/main/mcp/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <McpRoute />,
  },
  {
    route: "skills",
    titleKey: "nav.skills",
    icon: Sparkles,
    visible: true,
    highIo: true,
    preload: () => import("@/routes/desktop/main/skills/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <SkillsRoute />,
  },
  {
    route: "plugins",
    titleKey: "nav.plugins",
    icon: Puzzle,
    visible: true,
    highIo: true,
    preload: () => import("@/routes/desktop/main/plugins/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <PluginsRoute />,
  },
  {
    route: "relay",
    titleKey: "nav.relay",
    icon: RadioTower,
    visible: true,
    highIo: true,
    preload: () => import("@/routes/desktop/main/relay/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <RelayRoute />,
  },
  {
    route: "maintenance",
    titleKey: "nav.maintenance",
    icon: Wrench,
    visible: true,
    highIo: true,
    preload: () => import("@/routes/desktop/main/maintenance/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <MaintenanceRoute />,
  },
  {
    route: "settings",
    titleKey: "nav.settings",
    icon: Settings,
    visible: true,
    highIo: false,
    preload: () => import("@/routes/desktop/main/settings/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: (context: RouteRenderContext) => <SettingsRoute {...context.settings} />,
  },
  {
    route: "daemon-autoswitch",
    titleKey: "nav.daemonAutoswitch",
    icon: Activity,
    visible: false,
    highIo: true,
    preload: () => import("@/routes/desktop/main/daemon-autoswitch/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <DaemonAutoswitchRoute />,
  },
  {
    route: "tray-shell",
    titleKey: "nav.trayShell",
    icon: Headphones,
    visible: false,
    highIo: false,
    preload: () => import("@/routes/desktop/main/tray-shell/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <TrayShellRoute />,
  },
  {
    route: "voice",
    titleKey: "nav.voice",
    icon: Mic2,
    visible: false,
    highIo: true,
    preload: () => import("@/routes/desktop/main/voice/page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <VoiceRoute />,
  },
] satisfies RouteDefinitionInput[]).map(withRouteDefaults);

const routeDefinitionMap = new Map<Route, RouteDefinition>(
  routeDefinitions.map((definition) => [definition.route, definition]),
);

export function resolveRouteDefinition(route: Route) {
  return routeDefinitionMap.get(route) ?? routeDefinitions[0];
}

export function resolveRoutePath(route: Route) {
  return resolveRouteDefinition(route).path;
}

export function resolveRouteFromPath(pathname: string): Route {
  const normalizedPath = pathname === "/" ? "/overview" : pathname;
  return (
    routeDefinitions.find((definition) => definition.path === normalizedPath)
      ?.route ?? "overview"
  );
}
