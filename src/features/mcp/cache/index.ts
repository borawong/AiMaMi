import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";

export const McpCache = createModuleCacheOwner("mcp");
export const McpQueryKeys = McpCache.queryKeys;
export const MCP_SERVERS_QUERY_KEY = ["mcp-servers"] as const;
export const writeMcpAuthoritativePayload = McpCache.writeAuthoritativePayload;

export async function invalidateMcpContractQueries(queryClient: QueryClient) {
  await Promise.all([
    McpCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: MCP_SERVERS_QUERY_KEY }),
  ]);
}
