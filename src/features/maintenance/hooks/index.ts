/**
 * 中文职责说明：maintenance 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { maintenanceService } from "@/services/maintenance";
import { MaintenanceCache } from "../cache";

export function useMaintenanceCacheController() {
  return useModuleCacheController(MaintenanceCache);
}

export function useMaintenanceActionMutations(options: {
  onDiagnosed: (result: Awaited<ReturnType<typeof maintenanceService.diagnose>>) => void;
  onDiagnoseError: (error: unknown) => void;
  onCleaned: (result: Awaited<ReturnType<typeof maintenanceService.clean>>) => void;
  onCleanError: (error: unknown) => void;
  onRebuilt: (result: Awaited<ReturnType<typeof maintenanceService.rebuildRegistry>>) => void;
  onRebuildError: (error: unknown) => void;
  onRestarted: () => void;
  onRestartError: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  const diagnoseMutation = useMutation({
    mutationFn: () => maintenanceService.diagnose(),
    onSuccess: options.onDiagnosed,
    onError: options.onDiagnoseError,
  });

  const cleanMutation = useMutation({
    mutationFn: () => maintenanceService.clean(),
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      options.onCleaned(result);
    },
    onError: options.onCleanError,
  });

  const rebuildMutation = useMutation({
    mutationFn: () => maintenanceService.rebuildRegistry(),
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      options.onRebuilt(result);
    },
    onError: options.onRebuildError,
  });

  const restartMutation = useMutation({
    mutationFn: () => maintenanceService.restartCodex(),
    onSuccess: options.onRestarted,
    onError: options.onRestartError,
  });

  return {
    diagnoseMutation,
    cleanMutation,
    rebuildMutation,
    restartMutation,
  };
}
