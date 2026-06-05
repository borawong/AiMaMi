import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { voiceService } from "@/services/voice";
import { VoiceCache } from "../cache";

export function useVoiceCacheController() {
  return useModuleCacheController(VoiceCache);
}

export function useVoiceModule() {
  const queryClient = useQueryClient();

  const workspaceQuery = useQuery({
    queryKey: [...VoiceCache.queryKeys.root, "workspace"],
    queryFn: () => voiceService.loadWorkspace(),
    staleTime: 30_000,
  });
  const runtimeQuery = useQuery({
    queryKey: [...VoiceCache.queryKeys.root, "runtime"],
    queryFn: () => voiceService.loadRuntimeStatus(),
    staleTime: 30_000,
  });

  const permissionsMutation = useMutation({
    mutationFn: () => voiceService.requestPermissions(),
    onSuccess: (payload) => {
      VoiceCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: Date.now(),
        receivedAt: Date.now(),
      });
      void VoiceCache.invalidateContractQueries(queryClient);
    },
  });

  return {
    workspaceQuery,
    runtimeQuery,
    requestPermissionsAction: {
      id: "request-permissions",
      labelKey: "voice.requestPermissions",
      run: () => permissionsMutation.mutateAsync(),
      isPending: permissionsMutation.isPending,
    },
  };
}
