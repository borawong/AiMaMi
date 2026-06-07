import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type { McpServerSummary } from "@/types";
import type {
  McpCacheEnvelope,
  McpCachePayload,
  McpListEnvelope,
  McpMutationEnvelope,
  McpRemoveEnvelope,
} from "../types";
import {
  acceptMcpCacheSequence,
  nextMcpCacheSequence,
  type McpCachePayloadSource,
} from "./sequence";

export const McpCache = createModuleCacheOwner<McpCachePayload>("mcp");
export const McpQueryKeys = McpCache.queryKeys;
export const MCP_SERVERS_QUERY_KEY = ["mcp-servers"] as const;

export const writeMcpAuthoritativePayload = (
  queryClient: QueryClient,
  envelope: Omit<McpCacheEnvelope, "moduleId">,
) => McpCache.writeAuthoritativePayload(queryClient, envelope);

export { nextMcpCacheSequence } from "./sequence";

// Cache owner 统一拦截乱序刷新，避免 delayed refresh 覆盖更新后的 mutation payload。
export function writeMcpCachePayload<TPayload extends McpCachePayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: McpCachePayloadSource,
  sequence: number,
) {
  if (!acceptMcpCacheSequence(sequence)) {
    return false;
  }

  writeMcpAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
  return true;
}

export async function writeMcpMutationPayload<
  TPayload extends McpMutationEnvelope | McpRemoveEnvelope,
>(
  queryClient: QueryClient,
  payload: TPayload,
) {
  const accepted = writeMcpCachePayload(
    queryClient,
    payload,
    "mutation-payload",
    nextMcpCacheSequence(),
  );
  if (!accepted) return;

  writeMcpServersMutationPayload(queryClient, payload);
  await invalidateMcpContractQueries(queryClient);
}

export async function invalidateMcpContractQueries(queryClient: QueryClient) {
  await Promise.all([
    McpCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: MCP_SERVERS_QUERY_KEY }),
  ]);
}

function writeMcpServersMutationPayload(
  queryClient: QueryClient,
  payload: McpMutationEnvelope | McpRemoveEnvelope,
) {
  const data = payload.data;

  queryClient.setQueryData<McpListEnvelope>(
    MCP_SERVERS_QUERY_KEY,
    (current) => {
      if (!current) return current;

      if ("server" in data) {
        const items = upsertByName(current.data.items, data.server);
        return {
          ...current,
          data: {
            ...current.data,
            items,
            total: data.total,
            sourcePath: data.sourcePath,
          },
        };
      }

      if ("removedName" in data) {
        const items = current.data.items.filter((item) => item.name !== data.removedName);
        return {
          ...current,
          data: {
            ...current.data,
            items,
            total: data.total,
            sourcePath: data.sourcePath,
          },
        };
      }

      return current;
    },
  );
}

function upsertByName(items: McpServerSummary[], server: McpServerSummary) {
  const index = items.findIndex((item) => item.name === server.name);
  if (index === -1) return [...items, server];
  return items.map((item, itemIndex) => (itemIndex === index ? server : item));
}
