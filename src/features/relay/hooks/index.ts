import { useRef, type MutableRefObject } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import {
  relayService,
  type RelayNetworkConfig,
  type RelayProviderDraft,
} from "@/services/relay";
import { RelayCache } from "../cache";

export function useRelayCacheController() {
  return useModuleCacheController(RelayCache);
}

type RelayMutationContext = {
  sequence: number;
  receivedAt: number;
};

type RelayProviderIdeInput = {
  providerId: string;
  ide: string;
};

type RelayNetworkInput = {
  providerId: string;
  network: RelayNetworkConfig;
};

type RelayRouterInput = {
  enabled: boolean;
  relaunch: boolean;
};

type RelayExportInput = {
  filePath: string;
  includeApiKeys: boolean;
};

function useRelayEvidenceMutation<TVariables>(
  latestMutationSequenceRef: MutableRefObject<number>,
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, TVariables, RelayMutationContext>({
    mutationFn,
    onMutate: () => {
      const receivedAt = Date.now();
      const sequence = latestMutationSequenceRef.current + 1;
      latestMutationSequenceRef.current = sequence;
      return { sequence, receivedAt };
    },
    onSuccess: (payload, _variables, context) => {
      if (!context || context.sequence < latestMutationSequenceRef.current) {
        return;
      }

      RelayCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: context.sequence,
        receivedAt: context.receivedAt,
      });
      void RelayCache.invalidateContractQueries(queryClient);
    },
  });
}

export function useRelayModule() {
  const latestMutationSequenceRef = useRef(0);

  const stateQuery = useQuery({
    queryKey: RelayCache.queryKeys.state,
    queryFn: () => relayService.loadState(),
    staleTime: 30_000,
  });
  const activeQuery = useQuery({
    queryKey: RelayCache.queryKeys.active,
    queryFn: () => relayService.getActive(),
    staleTime: 30_000,
  });
  const proxyQuery = useQuery({
    queryKey: [...RelayCache.queryKeys.root, "proxy-status"],
    queryFn: () => relayService.getProxyStatus(),
    staleTime: 30_000,
  });
  const auditLogQuery = useQuery({
    queryKey: [...RelayCache.queryKeys.root, "passthrough-audit-log", 50],
    queryFn: () => relayService.getPassthroughAuditLog(50),
    staleTime: 30_000,
  });

  const upsertProviderMutation = useRelayEvidenceMutation<RelayProviderDraft>(
    latestMutationSequenceRef,
    (input) => relayService.upsert(input),
  );
  const deleteProviderMutation = useRelayEvidenceMutation<string>(
    latestMutationSequenceRef,
    (providerId) => relayService.delete(providerId),
  );
  const activateProviderMutation = useRelayEvidenceMutation<RelayProviderIdeInput>(
    latestMutationSequenceRef,
    ({ providerId, ide }) => relayService.activate(providerId, ide),
  );
  const deactivateProviderMutation = useRelayEvidenceMutation<RelayProviderIdeInput>(
    latestMutationSequenceRef,
    ({ providerId, ide }) => relayService.deactivate(providerId, ide),
  );
  const setNetworkMutation = useRelayEvidenceMutation<RelayNetworkInput>(
    latestMutationSequenceRef,
    ({ providerId, network }) => relayService.setNetwork(providerId, network),
  );
  const testProviderMutation = useRelayEvidenceMutation<string>(
    latestMutationSequenceRef,
    (providerId) => relayService.test(providerId),
  );
  const testDraftMutation = useRelayEvidenceMutation<RelayProviderDraft>(
    latestMutationSequenceRef,
    (input) => relayService.testDraft(input),
  );
  const fetchModelsDraftMutation = useRelayEvidenceMutation<RelayProviderDraft>(
    latestMutationSequenceRef,
    (input) => relayService.fetchModelsDraft(input),
  );
  const setRouterEnabledMutation = useRelayEvidenceMutation<RelayRouterInput>(
    latestMutationSequenceRef,
    ({ enabled, relaunch }) => relayService.setCodexRouterEnabled(enabled, relaunch),
  );
  const setBlockPassthroughMutation = useRelayEvidenceMutation<boolean>(
    latestMutationSequenceRef,
    (blocked) => relayService.setBlockOfficialPassthrough(blocked),
  );
  const exportConfigMutation = useRelayEvidenceMutation<RelayExportInput>(
    latestMutationSequenceRef,
    ({ filePath, includeApiKeys }) =>
      relayService.exportConfig(filePath, includeApiKeys),
  );
  const importConfigMutation = useRelayEvidenceMutation<string>(
    latestMutationSequenceRef,
    (filePath) => relayService.importConfig(filePath),
  );
  const diagnosticsMutation = useRelayEvidenceMutation<void>(
    latestMutationSequenceRef,
    () => relayService.runCodexRouterDiagnostics(),
  );
  const diagnoseRouterMutation = useRelayEvidenceMutation<void>(
    latestMutationSequenceRef,
    () => relayService.diagnoseCodexRouter(),
  );
  const fixRouterIssueMutation = useRelayEvidenceMutation<string>(
    latestMutationSequenceRef,
    (itemId) => relayService.fixCodexRouterIssue(itemId),
  );

  const isAnyMutationPending =
    upsertProviderMutation.isPending ||
    deleteProviderMutation.isPending ||
    activateProviderMutation.isPending ||
    deactivateProviderMutation.isPending ||
    setNetworkMutation.isPending ||
    testProviderMutation.isPending ||
    testDraftMutation.isPending ||
    fetchModelsDraftMutation.isPending ||
    setRouterEnabledMutation.isPending ||
    setBlockPassthroughMutation.isPending ||
    exportConfigMutation.isPending ||
    importConfigMutation.isPending ||
    diagnosticsMutation.isPending ||
    diagnoseRouterMutation.isPending ||
    fixRouterIssueMutation.isPending;

  return {
    stateQuery,
    activeQuery,
    proxyQuery,
    auditLogQuery,
    providerActions: {
      upsertProvider: {
        run: (input: RelayProviderDraft) => upsertProviderMutation.mutateAsync(input),
        isPending: upsertProviderMutation.isPending,
      },
      deleteProvider: {
        run: (providerId: string) => deleteProviderMutation.mutateAsync(providerId),
        isPending: deleteProviderMutation.isPending,
      },
      activateProvider: {
        run: (input: RelayProviderIdeInput) =>
          activateProviderMutation.mutateAsync(input),
        isPending: activateProviderMutation.isPending,
      },
      deactivateProvider: {
        run: (input: RelayProviderIdeInput) =>
          deactivateProviderMutation.mutateAsync(input),
        isPending: deactivateProviderMutation.isPending,
      },
      setNetwork: {
        run: (input: RelayNetworkInput) => setNetworkMutation.mutateAsync(input),
        isPending: setNetworkMutation.isPending,
      },
      testProvider: {
        run: (providerId: string) => testProviderMutation.mutateAsync(providerId),
        isPending: testProviderMutation.isPending,
      },
      testDraft: {
        run: (input: RelayProviderDraft) => testDraftMutation.mutateAsync(input),
        isPending: testDraftMutation.isPending,
      },
      fetchModelsDraft: {
        run: (input: RelayProviderDraft) => fetchModelsDraftMutation.mutateAsync(input),
        isPending: fetchModelsDraftMutation.isPending,
      },
    },
    routerActions: {
      setCodexRouterEnabled: {
        run: (input: RelayRouterInput) => setRouterEnabledMutation.mutateAsync(input),
        isPending: setRouterEnabledMutation.isPending,
      },
      setBlockOfficialPassthrough: {
        run: (blocked: boolean) => setBlockPassthroughMutation.mutateAsync(blocked),
        isPending: setBlockPassthroughMutation.isPending,
      },
      diagnoseCodexRouter: {
        run: () => diagnoseRouterMutation.mutateAsync(),
        isPending: diagnoseRouterMutation.isPending,
      },
      fixCodexRouterIssue: {
        run: (itemId: string) => fixRouterIssueMutation.mutateAsync(itemId),
        isPending: fixRouterIssueMutation.isPending,
      },
    },
    ioActions: {
      exportConfig: {
        run: (input: RelayExportInput) => exportConfigMutation.mutateAsync(input),
        isPending: exportConfigMutation.isPending,
      },
      importConfig: {
        run: (filePath: string) => importConfigMutation.mutateAsync(filePath),
        isPending: importConfigMutation.isPending,
      },
    },
    diagnosticsAction: {
      id: "diagnostics",
      labelKey: "relay.runDiagnostics",
      run: () => diagnosticsMutation.mutateAsync(),
      isPending: diagnosticsMutation.isPending,
    },
    isAnyMutationPending,
  };
}
