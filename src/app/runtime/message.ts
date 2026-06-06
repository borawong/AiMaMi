import type { QueryClient } from "@tanstack/react-query";

export const DESKTOP_MESSAGE_QUERY_KEY = ["desktop-message"] as const;
export const DESKTOP_MESSAGE_STALE_TIME = 60_000;

export interface DesktopMessagePayload {
  title?: string | null;
  body?: string | null;
  imageUrl?: string | null;
}

export async function loadDesktopMessageBoundary(): Promise<DesktopMessagePayload | null> {
  return null;
}

export function seedDesktopMessageBoundary(queryClient: QueryClient) {
  queryClient.setQueryData<DesktopMessagePayload | null>(
    DESKTOP_MESSAGE_QUERY_KEY,
    (current) => current ?? null,
  );
}
