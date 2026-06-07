import { useQuery } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { systemService } from "@/services/system";
import { TrayShellCache, TrayShellQueryKeys } from "../cache";
import type { TrayShellNotificationEnvelope } from "../types";

const TRAY_SHELL_NOTIFICATION_CLIENT_QUERY_KEY = [
  ...TrayShellQueryKeys.root,
  "notification-client",
] as const;

export function useTrayShellCacheController() {
  return useModuleCacheController(TrayShellCache);
}

export function useTrayShellNotificationQuery() {
  return useQuery<TrayShellNotificationEnvelope>({
    queryKey: TRAY_SHELL_NOTIFICATION_CLIENT_QUERY_KEY,
    queryFn: () => systemService.getNotificationClientState(),
    staleTime: 30_000,
  });
}
