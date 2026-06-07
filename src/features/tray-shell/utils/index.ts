import type { NotificationClientStatePayload } from "@/types";

export function selectTrayShellClient(
  value: NotificationClientStatePayload | null,
): string {
  return value?.deviceId || "-";
}

export function selectTrayShellReady(
  value: NotificationClientStatePayload | null,
): boolean {
  return Boolean(value?.deviceId);
}
