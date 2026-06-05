/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-contract-report.md; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-control-flow.jsonl
Frontend module: types/navigation
This file is a structured reconstruction scaffold, not recovered original source.
*/
export type Route =
  | "overview"
  | "accounts"
  | "sessions"
  | "analytics"
  | "custom-instructions"
  | "mcp"
  | "skills"
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
  "relay",
  "settings",
  "maintenance",
  "daemon-autoswitch",
  "tray-shell",
  "voice",
];

export function isAppRoute(value: string): value is Route {
  return (ALL_APP_ROUTES as string[]).includes(value);
}
