import { useQuery, type QueryClient } from "@tanstack/react-query";

export const DESKTOP_MESSAGE_QUERY_KEY = ["desktop-message"] as const;
export const DESKTOP_MESSAGE_STALE_TIME = 60_000;
export const DESKTOP_MESSAGE_SOURCE_STATUS = {
  sourceOnly: "source-only",
} as const;
export const DESKTOP_MESSAGE_SOURCE_REASON = {
  missingAuditableEndpoint: "missing-auditable-endpoint",
} as const;

export interface DesktopMessagePayload {
  title?: string | null;
  body?: string | null;
  imageUrl?: string | null;
}

export type DesktopMessageSourceStatus =
  (typeof DESKTOP_MESSAGE_SOURCE_STATUS)[keyof typeof DESKTOP_MESSAGE_SOURCE_STATUS];

export type DesktopMessageSourceReason =
  (typeof DESKTOP_MESSAGE_SOURCE_REASON)[keyof typeof DESKTOP_MESSAGE_SOURCE_REASON];

export interface DesktopMessageSourceState {
  status: DesktopMessageSourceStatus;
  reason: DesktopMessageSourceReason;
  detail: string;
}

export interface DesktopMessageQueryData {
  source: DesktopMessageSourceState;
  payload: DesktopMessagePayload | null;
}

export const DESKTOP_MESSAGE_SOURCE_ONLY_STATE: DesktopMessageSourceState = {
  status: DESKTOP_MESSAGE_SOURCE_STATUS.sourceOnly,
  reason: DESKTOP_MESSAGE_SOURCE_REASON.missingAuditableEndpoint,
  detail:
    "dumped 证据只确认 desktop-message queryKey 和 staleTime，没有可审计 endpoint。",
};

function createDesktopMessageQueryData(
  payload: DesktopMessagePayload | null,
  source: DesktopMessageSourceState = DESKTOP_MESSAGE_SOURCE_ONLY_STATE,
): DesktopMessageQueryData {
  return { source, payload };
}

export async function loadDesktopMessageBoundary(): Promise<DesktopMessageQueryData> {
  // 证据只覆盖 query 边界，不能在这里补一个未经审计的 endpoint。
  return createDesktopMessageQueryData(null);
}

export function writeDesktopMessageCache(
  queryClient: QueryClient,
  payload: DesktopMessagePayload | null,
  source?: DesktopMessageSourceState,
) {
  queryClient.setQueryData<DesktopMessageQueryData>(
    DESKTOP_MESSAGE_QUERY_KEY,
    createDesktopMessageQueryData(payload, source),
  );
}

export function seedDesktopMessageBoundary(queryClient: QueryClient) {
  queryClient.setQueryData<DesktopMessageQueryData>(
    DESKTOP_MESSAGE_QUERY_KEY,
    (current) => current ?? createDesktopMessageQueryData(null),
  );
}

export function useDesktopMessageQuery(enabled: boolean) {
  return useQuery({
    queryKey: DESKTOP_MESSAGE_QUERY_KEY,
    queryFn: loadDesktopMessageBoundary,
    staleTime: DESKTOP_MESSAGE_STALE_TIME,
    enabled,
  });
}
