/*
Restoration tier: P2
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-contract-report.md; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json
Frontend module: layout/sidebar
This file preserves the current UI shell and routes it through the reconstructed module boundary.
*/
import { useTranslation } from "react-i18next";
import {
  Activity,
  BarChart3,
  LayoutDashboard,
  FileCode2,
  Headphones,
  MessageSquareText,
  Mic2,
  RadioTower,
  Server,
  Sparkles,
  Users,
  Wrench,
  Settings,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";

import { useThemeValue, type Theme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import type { Route } from "@/types/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { AnimatedSegmentedControl } from "@/components/ui/animated-segmented-control";

export const appNavItems: {
  route: Route;
  icon: LucideIcon;
  labelKey: string;
  fallbackLabel: string;
}[] = [
  { route: "overview", icon: LayoutDashboard, labelKey: "nav.overview", fallbackLabel: "Overview" },
  { route: "accounts", icon: Users, labelKey: "nav.accounts", fallbackLabel: "Accounts" },
  { route: "sessions", icon: MessageSquareText, labelKey: "nav.sessions", fallbackLabel: "Sessions" },
  { route: "analytics", icon: BarChart3, labelKey: "nav.analytics", fallbackLabel: "Analytics" },
  { route: "custom-instructions", icon: FileCode2, labelKey: "nav.customInstructions", fallbackLabel: "Custom Instructions" },
  { route: "mcp", icon: Server, labelKey: "nav.mcp", fallbackLabel: "MCP" },
  { route: "skills", icon: Sparkles, labelKey: "nav.skills", fallbackLabel: "Skills" },
  { route: "relay", icon: RadioTower, labelKey: "nav.relay", fallbackLabel: "Relay" },
  { route: "settings", icon: Settings, labelKey: "nav.settings", fallbackLabel: "Settings" },
  { route: "maintenance", icon: Wrench, labelKey: "nav.maintenance", fallbackLabel: "Maintenance" },
  { route: "daemon-autoswitch", icon: Activity, labelKey: "nav.daemonAutoswitch", fallbackLabel: "Daemon Autoswitch" },
  { route: "tray-shell", icon: Headphones, labelKey: "nav.trayShell", fallbackLabel: "Tray Shell" },
  { route: "voice", icon: Mic2, labelKey: "nav.voice", fallbackLabel: "Voice" },
];

const hiddenNavRoutes = new Set<Route>([]);

export const SIDEBAR_EXPANDED_WIDTH_PX = 176 * 1.05;
export const SIDEBAR_COLLAPSED_WIDTH_PX = 64;

const SIDEBAR_LOGO_SRC = "/app-icon.png";
const SIDEBAR_LOGO_TOP_OFFSET_PX = -21;

const navButtonClassName =
  "group-data-[state=expanded]:!rounded-[8px] group-data-[state=expanded]:!px-3 group-data-[state=expanded]:!py-2 group-data-[state=expanded]:gap-2.5";

const footerNavButtonClassName = cn(
  navButtonClassName,
  "!h-7 min-h-0 shrink-0 group-data-[state=expanded]:!py-1.5",
);

const iconInactiveClass =
  "size-4 shrink-0 text-sidebar-foreground/80 group-hover/menu-item:text-sidebar-accent-foreground";

interface AppSidebarProps {
  activeRoute: Route;
  onNavigate: (route: Route) => void;
  onThemeChange: (theme: Theme) => void;
}

function ThemeGlyph({ resolved }: { resolved: "light" | "dark" }) {
  if (resolved === "dark") {
    return <Moon className={iconInactiveClass} strokeWidth={1.75} />;
  }
  return <Sun className={iconInactiveClass} strokeWidth={1.75} />;
}

function SidebarThemeToggle({
  resolvedTheme,
  onThemeChange,
  lightLabel,
  darkLabel,
  tooltipLabel,
}: {
  resolvedTheme: "light" | "dark";
  onThemeChange: (theme: Theme) => void;
  lightLabel: string;
  darkLabel: string;
  tooltipLabel: string;
}) {
  const tabs: { value: "light" | "dark"; label: string; icon: typeof Sun }[] = [
    { value: "light", label: lightLabel, icon: Sun },
    { value: "dark", label: darkLabel, icon: Moon },
  ];

  return (
    <SidebarMenuItem className="px-2 group-data-[collapsible=icon]/sidebar:px-0">
      <div className="group-data-[collapsible=icon]/sidebar:hidden">
        <div className="rounded-[8px] border border-sidebar-border/80 bg-sidebar-accent/45 p-1 shadow-[0_10px_22px_rgba(15,23,42,0.06)] dark:bg-white/[0.04] dark:shadow-none">
          <AnimatedSegmentedControl
            items={tabs}
            value={resolvedTheme}
            onValueChange={(nextTheme) => onThemeChange(nextTheme as "light" | "dark")}
            equalWidth
            className="gap-1"
            indicatorClassName="rounded-[8px] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.08)] dark:bg-white/[0.10]"
            itemClassName="h-8 gap-1.5 whitespace-nowrap rounded-[8px] px-2.5 text-[13px] font-medium [&_svg]:size-4"
            activeItemClassName="text-foreground dark:text-white"
            inactiveItemClassName="text-sidebar-foreground/72 hover:text-sidebar-foreground dark:text-sidebar-foreground/72 dark:hover:text-sidebar-foreground"
          />
        </div>
      </div>

      <SidebarMenuButton
        tooltip={tooltipLabel}
        className={cn(footerNavButtonClassName, "hidden group-data-[collapsible=icon]/sidebar:flex")}
        onClick={() => onThemeChange(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <ThemeGlyph resolved={resolvedTheme} />
        <span>{tooltipLabel}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  activeRoute,
  onNavigate,
  onThemeChange,
}: AppSidebarProps) {
  const { t } = useTranslation();
  const resolvedTheme = useThemeValue();

  const themeLabel =
    resolvedTheme === "dark" ? t("nav.sidebarDarkTheme") : t("nav.sidebarLightTheme");

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="!p-0">
        <div className="h-12 shrink-0" data-tauri-drag-region />
        <div
          className="hidden justify-center group-data-[collapsible=icon]/sidebar:flex"
          style={{ marginTop: SIDEBAR_LOGO_TOP_OFFSET_PX }}
        >
          <img
            src={SIDEBAR_LOGO_SRC}
            alt="AiMaMi"
            className="h-[35px] w-[35px] select-none rounded-full object-cover md:translate-x-1"
            draggable={false}
          />
        </div>
        <button
          type="button"
          onClick={() => onNavigate("overview")}
          className="group/header flex w-full items-center gap-3 rounded-[10px] pl-2.5 pr-3 py-1 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]/sidebar:hidden"
          style={{ marginTop: SIDEBAR_LOGO_TOP_OFFSET_PX }}
        >
          <div className="relative h-[35px] w-[35px] shrink-0">
            <img
              src={SIDEBAR_LOGO_SRC}
              alt="AiMaMi"
              className="h-full w-full select-none rounded-full object-cover"
              draggable={false}
            />
            <span
              aria-hidden
              className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar"
            />
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[15px] font-semibold text-sidebar-foreground">
              AiMaMi
            </span>
            <span className="truncate text-[11px] text-sidebar-foreground/60">
              Codex Assistant
            </span>
          </div>
        </button>
      </SidebarHeader>
      <SidebarContent className="pt-[18px]">
        <SidebarMenu>
          {appNavItems
            .filter((item) => !hiddenNavRoutes.has(item.route))
            .map(({ route, icon: Icon, labelKey, fallbackLabel }) => {
              const isActive = activeRoute === route;
              const label = t(labelKey, { defaultValue: fallbackLabel });
              return (
                <SidebarMenuItem key={route}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={label}
                    className={navButtonClassName}
                    onClick={() => onNavigate(route)}
                  >
                    <Icon
                      strokeWidth={1.75}
                      className={cn(
                        "size-4 shrink-0",
                        isActive
                          ? "text-primary"
                          : "text-sidebar-foreground/80 group-hover/menu-item:text-sidebar-accent-foreground",
                      )}
                    />
                    <span className="truncate">{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-0 pt-2 pb-2">
        <SidebarMenu className="!gap-0">
          <SidebarThemeToggle
            resolvedTheme={resolvedTheme}
            onThemeChange={onThemeChange}
            lightLabel={t("settings.light")}
            darkLabel={t("settings.dark")}
            tooltipLabel={themeLabel}
          />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
