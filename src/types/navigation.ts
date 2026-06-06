/**
 * 中文职责说明：定义应用 route 标识，具体 meta 由 route registry 持有。
 */
export type Route =
  | "overview"
  | "accounts"
  | "sessions"
  | "analytics"
  | "custom-instructions"
  | "mcp"
  | "skills"
  | "plugins"
  | "relay"
  | "settings"
  | "maintenance"
  | "daemon-autoswitch"
  | "tray-shell"
  | "voice";

export const ALL_APP_ROUTES: Route[] = [
  "overview",
  "accounts",
  "sessions",
  "analytics",
  "custom-instructions",
  "mcp",
  "skills",
  "plugins",
  "relay",
  "maintenance",
  "settings",
  "daemon-autoswitch",
  "tray-shell",
  "voice",
];

export function isAppRoute(value: string): value is Route {
  return (ALL_APP_ROUTES as string[]).includes(value);
}
