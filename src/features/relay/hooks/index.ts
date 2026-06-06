import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import {
  relayService,
  type RelayNetworkConfig,
  type RelayProviderDraft,
} from "@/services/relay";
import {
  invalidateRelayContractQueries,
  RelayCache,
  RELAY_STATE_QUERY_KEY,
} from "../cache";

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

const relayProxyStatusQueryKey = [...RelayCache.queryKeys.root, "proxy-status"] as const;
const relayAuditLogQueryKey = [
  ...RelayCache.queryKeys.root,
  "passthrough-audit-log",
  50,
] as const;

let relayCacheSequence = 0;
let relayLatestAcceptedSequence = 0;

function nextRelayCacheSequence() {
  relayCacheSequence += 1;
  return relayCacheSequence;
}

function writeRelayCachePayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "mutation-payload",
  sequence: number,
  receivedAt = Date.now(),
) {
  if (sequence < relayLatestAcceptedSequence) {
    return false;
  }

  relayLatestAcceptedSequence = sequence;
  RelayCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt,
  });
  return true;
}

async function runRelayQuery<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  load: () => Promise<TPayload>,
) {
  const sequence = nextRelayCacheSequence();
  const payload = await load();
  if (!writeRelayCachePayload(queryClient, payload, "full-refresh", sequence)) {
    return queryClient.getQueryData<TPayload>(queryKey) ?? payload;
  }
  return payload;
}

function useRelayEvidenceMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, TVariables, RelayMutationContext>({
    mutationFn,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: RELAY_STATE_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: RelayCache.queryKeys.root });
      const receivedAt = Date.now();
      const sequence = nextRelayCacheSequence();
      return { sequence, receivedAt };
    },
    onSuccess: (payload, _variables, context) => {
      if (
        !context ||
        !writeRelayCachePayload(
          queryClient,
          payload,
          "mutation-payload",
          context.sequence,
          context.receivedAt,
        )
      ) {
        return;
      }

      writeKnownRelayQueryPayload(queryClient, payload);
      void invalidateRelayContractQueries(queryClient);
    },
  });
}

function writeKnownRelayQueryPayload(queryClient: QueryClient, payload: unknown) {
  const data = readEnvelopeData(payload);
  if (!isRecord(data)) return;

  if (hasRelayStateShape(data)) {
    writeQueryPayload(queryClient, RELAY_STATE_QUERY_KEY, payload, data);
  }

  if (hasRelayActiveShape(data)) {
    writeQueryPayload(queryClient, RelayCache.queryKeys.active, payload, data);
  }

  if (hasRelayProxyShape(data)) {
    writeQueryPayload(queryClient, relayProxyStatusQueryKey, payload, data);
  }
}

function writeQueryPayload(
  queryClient: QueryClient,
  queryKey: QueryKey,
  sourcePayload: unknown,
  data: unknown,
) {
  queryClient.setQueryData<unknown>(queryKey, (current: unknown) => {
    if (isEnvelopeRecord(current)) {
      return { ...current, data };
    }
    if (isEnvelopeRecord(sourcePayload)) {
      return { ...sourcePayload, data };
    }
    return data;
  });
}

function readEnvelopeData(value: unknown) {
  if (isRecord(value) && "data" in value) {
    return value.data ?? null;
  }
  return value ?? null;
}

function hasRelayStateShape(value: Record<string, unknown>) {
  return (
    "providers" in value ||
    "items" in value ||
    "relayProviders" in value ||
    "routerEnabled" in value ||
    "codexRouterEnabled" in value ||
    "blockOfficialPassthrough" in value ||
    "passthroughBlocked" in value
  );
}

function hasRelayActiveShape(value: Record<string, unknown>) {
  return (
    "providerId" in value ||
    "activeProviderId" in value ||
    "ide" in value ||
    "activeIde" in value
  );
}

function hasRelayProxyShape(value: Record<string, unknown>) {
  return "reachable" in value || "status" in value || "code" in value;
}

function isEnvelopeRecord(value: unknown): value is Record<string, unknown> & { data: unknown } {
  return isRecord(value) && "data" in value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function useRelayModule() {
  const queryClient = useQueryClient();
  const stateQuery = useQuery({
    queryKey: RELAY_STATE_QUERY_KEY,
    queryFn: () =>
      runRelayQuery(queryClient, RELAY_STATE_QUERY_KEY, () => relayService.loadState()),
    staleTime: 30_000,
  });
  const activeQuery = useQuery({
    queryKey: RelayCache.queryKeys.active,
    queryFn: () =>
      runRelayQuery(queryClient, RelayCache.queryKeys.active, () =>
        relayService.getActive(),
      ),
    staleTime: 30_000,
  });
  const proxyQuery = useQuery({
    queryKey: relayProxyStatusQueryKey,
    queryFn: () =>
      runRelayQuery(queryClient, relayProxyStatusQueryKey, () =>
        relayService.getProxyStatus(),
      ),
    staleTime: 30_000,
  });
  const auditLogQuery = useQuery({
    queryKey: relayAuditLogQueryKey,
    queryFn: () =>
      runRelayQuery(queryClient, relayAuditLogQueryKey, () =>
        relayService.getPassthroughAuditLog(50),
      ),
    staleTime: 30_000,
  });

  const upsertProviderMutation = useRelayEvidenceMutation<RelayProviderDraft>(
    (input) => relayService.upsert(input),
  );
  const deleteProviderMutation = useRelayEvidenceMutation<string>(
    (providerId) => relayService.delete(providerId),
  );
  const activateProviderMutation = useRelayEvidenceMutation<RelayProviderIdeInput>(
    ({ providerId, ide }) => relayService.activate(providerId, ide),
  );
  const deactivateProviderMutation = useRelayEvidenceMutation<RelayProviderIdeInput>(
    ({ providerId, ide }) => relayService.deactivate(providerId, ide),
  );
  const setNetworkMutation = useRelayEvidenceMutation<RelayNetworkInput>(
    ({ providerId, network }) => relayService.setNetwork(providerId, network),
  );
  const testProviderMutation = useRelayEvidenceMutation<string>(
    (providerId) => relayService.test(providerId),
  );
  const testDraftMutation = useRelayEvidenceMutation<RelayProviderDraft>(
    (input) => relayService.testDraft(input),
  );
  const fetchModelsDraftMutation = useRelayEvidenceMutation<RelayProviderDraft>(
    (input) => relayService.fetchModelsDraft(input),
  );
  const setRouterEnabledMutation = useRelayEvidenceMutation<RelayRouterInput>(
    ({ enabled, relaunch }) => relayService.setCodexRouterEnabled(enabled, relaunch),
  );
  const restartCodexAppMutation = useRelayEvidenceMutation<void>(
    () => relayService.restartCodexApp(),
  );
  const setBlockPassthroughMutation = useRelayEvidenceMutation<boolean>(
    (blocked) => relayService.setBlockOfficialPassthrough(blocked),
  );
  const exportConfigMutation = useRelayEvidenceMutation<RelayExportInput>(
    ({ filePath, includeApiKeys }) =>
      relayService.exportConfig(filePath, includeApiKeys),
  );
  const importConfigMutation = useRelayEvidenceMutation<string>(
    (filePath) => relayService.importConfig(filePath),
  );
  const diagnosticsMutation = useRelayEvidenceMutation<void>(
    () => relayService.runCodexRouterDiagnostics(),
  );
  const diagnoseRouterMutation = useRelayEvidenceMutation<void>(
    () => relayService.diagnoseCodexRouter(),
  );
  const fixRouterIssueMutation = useRelayEvidenceMutation<string>(
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
    restartCodexAppMutation.isPending ||
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
      restartCodexApp: {
        run: () => restartCodexAppMutation.mutateAsync(),
        isPending: restartCodexAppMutation.isPending,
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
