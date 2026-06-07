import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  relayService,
  type RelayExportDialogInput,
  type RelayImportDialogInput,
  type RelayProviderDraft,
} from "@/services/relay";
import type {
  CoreEnvelope,
  RelayDiagnosticPayload,
} from "@/types";
import {
  cancelRelayMutationQueries as cancelQueriesForRelayMutation,
  invalidateRelayContractQueries,
  nextRelayCacheSequence,
  writeRelayMutationPayload,
  writeRelayRouterToggleQueryPayload,
  writeRelayStateQueryPayload,
} from "../cache";
import type {
  RelayExportInput,
  RelayMutationController,
  RelayMutationDataPayload,
  RelayNetworkInput,
  RelayProviderIdeInput,
  RelayRouterInput,
} from "../types";

type RelayMutationContext = {
  sequence: number;
  receivedAt: number;
};

export function useRelayEvidenceMutation<
  TVariables,
  TPayload extends RelayMutationDataPayload,
>(
  mutationFn: (variables: TVariables) => Promise<CoreEnvelope<TPayload>>,
  writeKnownQueries?: (
    queryClient: QueryClient,
    payload: CoreEnvelope<TPayload>,
  ) => void,
) {
  const queryClient = useQueryClient();

  return useMutation<CoreEnvelope<TPayload>, Error, TVariables, RelayMutationContext>({
    mutationFn,
    onMutate: async () => {
      await cancelQueriesForRelayMutation(queryClient);
      const receivedAt = Date.now();
      const sequence = nextRelayCacheSequence();
      return { sequence, receivedAt };
    },
    onSuccess: (payload, _variables, context) => {
      if (
        !context ||
        !writeRelayMutationPayload(
          queryClient,
          payload,
          context.sequence,
          context.receivedAt,
        )
      ) {
        return;
      }

      writeKnownQueries?.(queryClient, payload);
      void invalidateRelayContractQueries(queryClient);
    },
  });
}

export function useRelayVoidMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<void>,
) {
  return useMutation<void, Error, TVariables>({ mutationFn });
}

export function useRelayMutations(): RelayMutationController {
  const upsertProviderMutation = useRelayEvidenceMutation(
    (input: RelayProviderDraft) => relayService.upsert(input),
  );
  const deleteProviderMutation = useRelayEvidenceMutation(
    (providerId: string) => relayService.delete(providerId),
    writeRelayStateQueryPayload,
  );
  const activateProviderMutation = useRelayEvidenceMutation(
    ({ providerId, ide }: RelayProviderIdeInput) =>
      relayService.activate(providerId, ide),
    writeRelayStateQueryPayload,
  );
  const deactivateProviderMutation = useRelayEvidenceMutation(
    ({ providerId, ide }: RelayProviderIdeInput) =>
      relayService.deactivate(providerId, ide),
    writeRelayStateQueryPayload,
  );
  const setNetworkMutation = useRelayEvidenceMutation(
    ({ providerId, network }: RelayNetworkInput) =>
      relayService.setNetwork(providerId, network),
  );
  const testProviderMutation = useRelayEvidenceMutation(
    (providerId: string) => relayService.test(providerId),
  );
  const testDraftMutation = useRelayEvidenceMutation(
    (input: RelayProviderDraft) => relayService.testDraft(input),
  );
  const fetchModelsDraftMutation = useRelayEvidenceMutation(
    (input: RelayProviderDraft) => relayService.fetchModelsDraft(input),
  );
  const setRouterEnabledMutation = useRelayEvidenceMutation(
    ({ enabled, relaunch }: RelayRouterInput) =>
      relayService.setCodexRouterEnabled(enabled, relaunch),
    writeRelayRouterToggleQueryPayload,
  );
  const restartCodexAppMutation = useRelayVoidMutation<void>(
    () => relayService.restartCodexApp(),
  );
  const setBlockPassthroughMutation = useRelayEvidenceMutation(
    (blocked: boolean) => relayService.setBlockOfficialPassthrough(blocked),
  );
  const exportConfigMutation = useRelayEvidenceMutation(
    ({ filePath, includeApiKeys }: RelayExportInput) =>
      relayService.exportConfig(filePath, includeApiKeys),
  );
  const exportConfigWithDialogMutation =
    useRelayEvidenceMutation((input: RelayExportDialogInput) =>
      relayService.exportConfigWithDialog(input),
    );
  const importConfigMutation = useRelayEvidenceMutation(
    (filePath: string) => relayService.importConfig(filePath),
  );
  const importConfigWithDialogMutation =
    useRelayEvidenceMutation((input: RelayImportDialogInput) =>
      relayService.importConfigWithDialog(input),
    );
  const diagnosticsMutation = useRelayEvidenceMutation<void, RelayDiagnosticPayload>(
    () => relayService.runCodexRouterDiagnostics(),
  );
  const diagnoseRouterMutation = useRelayEvidenceMutation<void, RelayDiagnosticPayload>(
    () => relayService.diagnoseCodexRouter(),
  );
  const fixRouterIssueMutation = useRelayEvidenceMutation(
    (itemId: string) => relayService.fixCodexRouterIssue(itemId),
  );

  return {
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
      exportConfigWithDialog: {
        run: (input: RelayExportDialogInput) =>
          exportConfigWithDialogMutation.mutateAsync(input),
        isPending: exportConfigWithDialogMutation.isPending,
      },
      importConfig: {
        run: (filePath: string) => importConfigMutation.mutateAsync(filePath),
        isPending: importConfigMutation.isPending,
      },
      importConfigWithDialog: {
        run: (input: RelayImportDialogInput) =>
          importConfigWithDialogMutation.mutateAsync(input),
        isPending: importConfigWithDialogMutation.isPending,
      },
    },
    diagnosticsAction: {
      id: "diagnostics",
      labelKey: "relay.runDiagnostics",
      run: () => diagnosticsMutation.mutateAsync(),
      isPending: diagnosticsMutation.isPending,
    },
  } satisfies RelayMutationController;
}
