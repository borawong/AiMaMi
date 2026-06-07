import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mcpService, type UpsertMcpServerInput } from "@/services/mcp";
import {
  MCP_SERVERS_QUERY_KEY,
  writeMcpMutationPayload,
} from "../cache";

export type { UpsertMcpServerInput } from "@/services/mcp";

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
