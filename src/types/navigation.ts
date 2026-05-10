export type Route =
  | "overview"
  | "customInstructions"
  | "mcp"
  | "skills"
  | "maintenance"
  | "settings";

export const ALL_APP_ROUTES: Route[] = [
  "overview",
  "customInstructions",
  "mcp",
  "skills",
  "maintenance",
  "settings",
];

export function isAppRoute(value: string): value is Route {
  return (ALL_APP_ROUTES as string[]).includes(value);
}
