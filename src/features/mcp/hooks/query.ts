import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { mcpService } from "@/services/mcp";
import {
  invalidateMcpContractQueries,
  McpCache,
  MCP_SERVERS_QUERY_KEY,
  nextMcpCacheSequence,
  writeMcpCachePayload,
} from "../cache";
import type { McpListEnvelope } from "../types";

export function useMcpCacheController() {
  return useModuleCacheController(McpCache);
}

export function useMcpServers() {
  const queryClient = useQueryClient();

  const serversQuery = useQuery({
    queryKey: MCP_SERVERS_QUERY_KEY,
    queryFn: async () => {
      const sequence = nextMcpCacheSequence();
      const payload = await mcpService.loadServers();
      const accepted = writeMcpCachePayload(
        queryClient,
        payload,
        "full-refresh",
        sequence,
      );
      if (!accepted) {
        return queryClient.getQueryData<McpListEnvelope>(MCP_SERVERS_QUERY_KEY) ?? payload;
      }
      return payload;
    },
    staleTime: Infinity,
  });

  const refresh = useCallback(
    () => invalidateMcpContractQueries(queryClient),
    [queryClient],
  );

  return {
    ...serversQuery,
    refresh,
  };
}
