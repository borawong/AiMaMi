import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { systemService } from "@/services/system";
import { TrayShellCache } from "../cache";

export function useTrayShellCacheController() {
  return useModuleCacheController(TrayShellCache);
}

export function useTrayShellModule() {
  const queryClient = useQueryClient();

  const notificationQuery = useQuery({
    queryKey: [...TrayShellCache.queryKeys.root, "notification-client"],
    queryFn: () => systemService.getNotificationClientState(),
    staleTime: 30_000,
  });

  const focusMutation = useMutation({
    mutationFn: () => systemService.focusMainWindow(),
    onSuccess: (payload) => {
      TrayShellCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: Date.now(),
        receivedAt: Date.now(),
      });
      void TrayShellCache.invalidateContractQueries(queryClient);
    },
  });

  return {
    notificationQuery,
    focusAction: {
      id: "focus-main-window",
      labelKey: "trayShell.focusMainWindow",
      run: () => focusMutation.mutateAsync(),
      isPending: focusMutation.isPending,
    },
  };
}
