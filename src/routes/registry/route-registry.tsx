/**
 * 中文职责说明：route registry 是 route、layout、错误边界、标题、图标、可见性、预加载、骨架和高 IO 反馈的唯一 owner。
 */
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
import type { SettingsRouteProps } from "@/routes/desktop/main/settings/settings-page";
import type { Route } from "@/types/navigation";
import { RouteHighIoFeedback } from "@/routes/registry/high-io-feedback";
import { RouteShellSkeleton } from "@/routes/registry/route-skeletons";
import { ErrorBoundary } from "@/components/error-boundary";

const OverviewRoute = lazy(() =>
  import("@/routes/desktop/main/overview/overview-page").then((module) => ({
    default: module.OverviewRoute,
  })),
);
const AccountsRoute = lazy(() =>
  import("@/routes/desktop/main/accounts/accounts-page").then((module) => ({
    default: module.AccountsRoute,
  })),
);
const SessionsRoute = lazy(() =>
  import("@/routes/desktop/main/sessions/sessions-page").then((module) => ({
    default: module.SessionsRoute,
  })),
);
const AnalyticsRoute = lazy(() =>
  import("@/routes/desktop/main/analytics/analytics-page").then((module) => ({
    default: module.AnalyticsRoute,
  })),
);
const CustomInstructionsRoute = lazy(() =>
  import("@/routes/desktop/main/custom-instructions/custom-instructions-page").then((module) => ({
    default: module.CustomInstructionsRoute,
  })),
);
const McpRoute = lazy(() =>
  import("@/routes/desktop/main/mcp/mcp-page").then((module) => ({
    default: module.McpRoute,
  })),
);
const SkillsRoute = lazy(() =>
  import("@/routes/desktop/main/skills/skills-page").then((module) => ({
    default: module.SkillsRoute,
  })),
);
const PluginsRoute = lazy(() =>
  import("@/routes/desktop/main/plugins/plugins-page").then((module) => ({
    default: module.PluginsRoute,
  })),
);
const RelayRoute = lazy(() =>
  import("@/routes/desktop/main/relay/relay-page").then((module) => ({
    default: module.RelayRoute,
  })),
);
const SettingsRoute = lazy(() =>
  import("@/routes/desktop/main/settings/settings-page").then((module) => ({
    default: module.SettingsRoute,
  })),
);
const MaintenanceRoute = lazy(() =>
  import("@/routes/desktop/main/maintenance/maintenance-page").then((module) => ({
    default: module.MaintenanceRoute,
  })),
);
const DaemonAutoswitchRoute = lazy(() =>
  import("@/routes/desktop/main/daemon-autoswitch/daemon-autoswitch-page").then((module) => ({
    default: module.DaemonAutoswitchRoute,
  })),
);
const TrayShellRoute = lazy(() =>
  import("@/routes/desktop/main/tray-shell/tray-shell-page").then((module) => ({
    default: module.TrayShellRoute,
  })),
);
const VoiceRoute = lazy(() =>
  import("@/routes/desktop/main/voice/voice-page").then((module) => ({
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
    preload: () => import("@/routes/desktop/main/overview/overview-page"),
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
    preload: () => import("@/routes/desktop/main/accounts/accounts-page"),
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
    preload: () => import("@/routes/desktop/main/sessions/sessions-page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <SessionsRoute />,
  },
  {
    route: "analytics",
    titleKey: "nav.analytics",
    icon: BarChart3,
    visible: true,
    highIo: true,
    preload: () => import("@/routes/desktop/main/analytics/analytics-page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <AnalyticsRoute />,
  },
  {
    route: "custom-instructions",
    titleKey: "nav.customInstructions",
    icon: FileCode2,
    visible: true,
    highIo: true,
    preload: () => import("@/routes/desktop/main/custom-instructions/custom-instructions-page"),
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
    preload: () => import("@/routes/desktop/main/mcp/mcp-page"),
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
    preload: () => import("@/routes/desktop/main/skills/skills-page"),
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
    preload: () => import("@/routes/desktop/main/plugins/plugins-page"),
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
    preload: () => import("@/routes/desktop/main/relay/relay-page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <RelayRoute />,
  },
  {
    route: "settings",
    titleKey: "nav.settings",
    icon: Settings,
    visible: true,
    highIo: false,
    preload: () => import("@/routes/desktop/main/settings/settings-page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: (context: RouteRenderContext) => <SettingsRoute {...context.settings} />,
  },
  {
    route: "maintenance",
    titleKey: "nav.maintenance",
    icon: Wrench,
    visible: true,
    highIo: true,
    preload: () => import("@/routes/desktop/main/maintenance/maintenance-page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <MaintenanceRoute />,
  },
  {
    route: "daemon-autoswitch",
    titleKey: "nav.daemonAutoswitch",
    icon: Activity,
    visible: true,
    highIo: true,
    preload: () => import("@/routes/desktop/main/daemon-autoswitch/daemon-autoswitch-page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <DaemonAutoswitchRoute />,
  },
  {
    route: "tray-shell",
    titleKey: "nav.trayShell",
    icon: Headphones,
    visible: true,
    highIo: false,
    preload: () => import("@/routes/desktop/main/tray-shell/tray-shell-page"),
    skeleton: <RouteShellSkeleton />,
    HighIoFeedback: RouteHighIoFeedback,
    render: () => <TrayShellRoute />,
  },
  {
    route: "voice",
    titleKey: "nav.voice",
    icon: Mic2,
    visible: true,
    highIo: true,
    preload: () => import("@/routes/desktop/main/voice/voice-page"),
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
