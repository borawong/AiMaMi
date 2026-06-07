import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { maintenanceService } from "@/services/maintenance";
import {
  MaintenanceCache,
  MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
  MAINTENANCE_SYSTEM_INFO_QUERY_KEY,
  runMaintenanceQuery,
} from "../cache";

export function useMaintenanceCacheController() {
  return useModuleCacheController(MaintenanceCache);
}

export function useMaintenanceQueries() {
  const queryClient = useQueryClient();

  const imageCompatQuery = useQuery({
    queryKey: MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
    queryFn: () =>
      runMaintenanceQuery(
        queryClient,
        MAINTENANCE_IMAGE_COMPAT_QUERY_KEY,
        () => maintenanceService.getImageCompat(),
      ),
    staleTime: 30_000,
  });

  const systemInfoQuery = useQuery({
    queryKey: MAINTENANCE_SYSTEM_INFO_QUERY_KEY,
    queryFn: () =>
      runMaintenanceQuery(queryClient, MAINTENANCE_SYSTEM_INFO_QUERY_KEY, () =>
        maintenanceService.getSystemInfo(),
      ),
    staleTime: 30_000,
  });

  return {
    imageCompatQuery,
    systemInfoQuery,
  };
}
