/**
 * 中文职责说明：mcp 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { mcpService, type UpsertMcpServerInput } from "@/services/mcp";
import { McpCache } from "../cache";

export type { UpsertMcpServerInput } from "@/services/mcp";

let mcpCacheSequence = 0;

function nextMcpCacheSequence() {
  mcpCacheSequence += 1;
  return mcpCacheSequence;
}

function writeMcpCachePayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "mutation-payload",
  sequence: number,
) {
  McpCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
}

async function writeMcpMutationPayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
) {
  writeMcpCachePayload(
    queryClient,
    payload,
    "mutation-payload",
    nextMcpCacheSequence(),
  );
  await McpCache.invalidateContractQueries(queryClient);
}

export function useMcpCacheController() {
  return useModuleCacheController(McpCache);
}

export function useMcpServers() {
  const queryClient = useQueryClient();

  const serversQuery = useQuery({
    queryKey: McpCache.queryKeys.root,
    queryFn: async () => {
      const sequence = nextMcpCacheSequence();
      const payload = await mcpService.loadServers();
      writeMcpCachePayload(queryClient, payload, "full-refresh", sequence);
      return payload;
    },
    staleTime: Infinity,
  });

  const refresh = useCallback(
    () => McpCache.invalidateContractQueries(queryClient),
    [queryClient],
  );

  return {
    ...serversQuery,
    refresh,
  };
}

export function useMcpServerMutations(options?: { onRemoved?: () => void }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      mcpService.setServerEnabled(name, enabled),
    onSuccess: (payload) => writeMcpMutationPayload(queryClient, payload),
  });

  const removeMutation = useMutation({
    mutationFn: (name: string) => mcpService.removeServer(name),
    onSuccess: async (payload) => {
      await writeMcpMutationPayload(queryClient, payload);
      options?.onRemoved?.();
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
    onSuccess: async (payload) => {
      await writeMcpMutationPayload(queryClient, payload);
      options?.onSaved?.();
    },
  });
}
