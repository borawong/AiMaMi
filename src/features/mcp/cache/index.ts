import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type { McpCacheEnvelope, McpCachePayload } from "../types";

export const McpCache = createModuleCacheOwner<McpCachePayload>("mcp");
export const McpQueryKeys = McpCache.queryKeys;
export const MCP_SERVERS_QUERY_KEY = ["mcp-servers"] as const;
export const writeMcpAuthoritativePayload = (
  queryClient: QueryClient,
  envelope: Omit<McpCacheEnvelope, "moduleId">,
) => McpCache.writeAuthoritativePayload(queryClient, envelope);

export async function invalidateMcpContractQueries(queryClient: QueryClient) {
  await Promise.all([
    McpCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: MCP_SERVERS_QUERY_KEY }),
  ]);
}
