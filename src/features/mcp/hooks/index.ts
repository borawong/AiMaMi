/**
 * 中文职责说明：mcp 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { mcpService, type UpsertMcpServerInput } from "@/services/mcp";
import type {
  CoreEnvelope,
  McpServerListPayload,
  McpServerSummary,
} from "@/types";
import {
  invalidateMcpContractQueries,
  McpCache,
  MCP_SERVERS_QUERY_KEY,
} from "../cache";

export type { UpsertMcpServerInput } from "@/services/mcp";

let mcpCacheSequence = 0;
let mcpLatestAcceptedSequence = 0;

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
  if (sequence < mcpLatestAcceptedSequence) {
    return false;
  }

  mcpLatestAcceptedSequence = sequence;
  McpCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
  return true;
}

async function writeMcpMutationPayload<TPayload>(
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
        return queryClient.getQueryData<typeof payload>(MCP_SERVERS_QUERY_KEY) ?? payload;
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

export function useMcpServerMutations(options?: { onRemoved?: () => void }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      mcpService.setServerEnabled(name, enabled),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: MCP_SERVERS_QUERY_KEY }),
    onSuccess: (payload) => writeMcpMutationPayload(queryClient, payload),
  });

  const removeMutation = useMutation({
    mutationFn: (name: string) => mcpService.removeServer(name),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: MCP_SERVERS_QUERY_KEY }),
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
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: MCP_SERVERS_QUERY_KEY }),
    onSuccess: async (payload) => {
      await writeMcpMutationPayload(queryClient, payload);
      options?.onSaved?.();
    },
  });
}

function writeMcpServersMutationPayload(queryClient: QueryClient, payload: unknown) {
  const data = readEnvelopeData(payload);
  if (!isRecord(data)) return;

  queryClient.setQueryData<CoreEnvelope<McpServerListPayload>>(
    MCP_SERVERS_QUERY_KEY,
    (current) => {
      if (!isMcpListEnvelope(current)) return current;

      const server = data.server;
      if (isMcpServerSummary(server)) {
        const items = upsertByName(current.data.items, server);
        return {
          ...current,
          data: {
            ...current.data,
            items,
            total: readNumber(data.total) ?? items.length,
            sourcePath: readString(data.sourcePath) ?? current.data.sourcePath,
          },
        };
      }

      const removedName = readString(data.removedName);
      if (removedName) {
        const items = current.data.items.filter((item) => item.name !== removedName);
        return {
          ...current,
          data: {
            ...current.data,
            items,
            total: readNumber(data.total) ?? items.length,
            sourcePath: readString(data.sourcePath) ?? current.data.sourcePath,
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

function readEnvelopeData(value: unknown) {
  if (isRecord(value) && "data" in value) {
    return value.data ?? null;
  }
  return null;
}

function isMcpListEnvelope(
  value: unknown,
): value is CoreEnvelope<McpServerListPayload> {
  return isRecord(value) && isRecord(value.data) && Array.isArray(value.data.items);
}

function isMcpServerSummary(value: unknown): value is McpServerSummary {
  return isRecord(value) && typeof value.name === "string";
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
