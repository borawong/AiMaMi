import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { daemonAutoswitchService } from "@/services/daemon-autoswitch";
import {
  DAEMON_AUTOSWITCH_PENDING_QUERY_KEY,
  invalidateDaemonAutoswitchContractQueries,
} from "../cache";
import type { DaemonAutoswitchRuntimeController } from "../types";

export function useDaemonAutoswitchRuntimeSubscriptions(): DaemonAutoswitchRuntimeController {
  const queryClient = useQueryClient();

  useEffect(() => {
    return daemonAutoswitchService.subscribePendingAutoSwitch(() => {
      void invalidateDaemonAutoswitchContractQueries(queryClient);
      void queryClient.invalidateQueries({
        queryKey: DAEMON_AUTOSWITCH_PENDING_QUERY_KEY,
        type: "active",
      });
    });
  }, [queryClient]);

  return {
    pendingAutoSwitchSubscribed: true,
  };
}
