/**
 * 中文职责说明：mcp 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { mcpService, type UpsertMcpServerInput } from "@/services/mcp";
import { McpCache } from "../cache";

export type { UpsertMcpServerInput } from "@/services/mcp";

export function useMcpCacheController() {
  return useModuleCacheController(McpCache);
}

export function useMcpServers() {
  return useQuery({
    queryKey: ["mcp-servers"],
    queryFn: () => mcpService.loadServers(),
    staleTime: Infinity,
  });
}

export function useMcpServerMutations(options?: { onRemoved?: () => void }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      mcpService.setServerEnabled(name, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mcp-servers"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (name: string) => mcpService.removeServer(name),
    onSuccess: () => {
      options?.onRemoved?.();
      queryClient.invalidateQueries({ queryKey: ["mcp-servers"] });
    },
  });

  return {
    toggleMutation,
    removeMutation,
  };
}

export function useUpsertMcpServerMutation(options?: { onSaved?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertMcpServerInput) => mcpService.upsertServer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-servers"] });
      options?.onSaved?.();
    },
  });
}
