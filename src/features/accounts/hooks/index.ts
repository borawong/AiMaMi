import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ModuleCacheEnvelope } from "@/features/_shared/module-cache";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { accountsService } from "@/services/accounts";
import {
  AccountsAuthoritativeQueryKeys,
  AccountsCache,
  AccountsDumpedQueryKeys,
  invalidateAccountsDumpedQueries,
  writeAccountsMutationPayload,
  writeAccountsSnapshotPayload,
} from "../cache";
import type {
  AccountExportFileInput,
  AccountImportFileInput,
  AccountImportSessionInput,
  AccountKeysInput,
  AccountOpenPathInput,
  AccountPreviewImportInput,
  AccountSwitchInput,
} from "../types";

export function useAccountsCacheController() {
  return useModuleCacheController(AccountsCache);
}

export function useAccountsModule() {
  const queryClient = useQueryClient();
  const sequenceRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const nextSequence = () => ++sequenceRef.current;
  const writeSnapshotPayload = (
    payload: unknown,
    source: "full-refresh" | "active-only-refresh",
  ) => {
    writeAccountsSnapshotPayload(queryClient, {
      payload,
      source,
      sequence: nextSequence(),
      receivedAt: Date.now(),
    });
  };
  const writeMutationPayload = (
    payload: unknown,
    options: { invalidateDumpedQueries?: boolean } = {},
  ) => {
    writeAccountsMutationPayload(queryClient, {
      payload,
      source: "mutation-payload",
      sequence: nextSequence(),
      receivedAt: Date.now(),
    });
    if (options.invalidateDumpedQueries ?? true) {
      void invalidateAccountsDumpedQueries(queryClient);
    }
  };

  const snapshotEnvelopeQuery = useQuery<ModuleCacheEnvelope<unknown> | null>({
    queryKey: AccountsAuthoritativeQueryKeys.snapshot,
    queryFn: async () =>
      queryClient.getQueryData<ModuleCacheEnvelope<unknown>>(
        AccountsAuthoritativeQueryKeys.snapshot,
      ) ?? null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const snapshotQuery = useQuery({
    queryKey: AccountsDumpedQueryKeys.snapshot,
    queryFn: async () => {
      const sequence = nextSequence();
      const payload = await accountsService.loadSnapshot(true);
      writeAccountsSnapshotPayload(queryClient, {
        payload,
        source: "full-refresh",
        sequence,
        receivedAt: Date.now(),
      });
      return payload;
    },
    staleTime: 30_000,
  });

  const attachMonitorMutation = useMutation({
    mutationFn: () => accountsService.beginAddAccountAttachMonitor(),
    onSuccess: (payload) => writeMutationPayload(payload),
  });

  const refreshUsageSnapshotMutation = useMutation({
    mutationFn: () => accountsService.refreshUsageSnapshot(),
    onSuccess: (payload) => {
      writeSnapshotPayload(payload, "active-only-refresh");
      void invalidateAccountsDumpedQueries(queryClient);
    },
  });

  const switchAccountMutation = useMutation({
    mutationFn: ({ accountKey }: AccountSwitchInput) =>
      accountsService.switchAccount(accountKey),
    onSuccess: (payload) => writeMutationPayload(payload),
  });

  const switchAccountAndRestartMutation = useMutation({
    mutationFn: ({ accountKey }: AccountSwitchInput) =>
      accountsService.switchAccountAndRestartCodex(accountKey),
    onSuccess: (payload) => writeMutationPayload(payload),
  });

  const removeAccountsMutation = useMutation({
    mutationFn: ({ accountKeys }: AccountKeysInput) =>
      accountsService.removeAccounts(accountKeys),
    onSuccess: (payload) => writeMutationPayload(payload),
  });

  const logoutMutation = useMutation({
    mutationFn: () => accountsService.logout(),
    onSuccess: (payload) => writeMutationPayload(payload),
  });

  const importSessionMutation = useMutation({
    mutationFn: ({ sessionJson, overwriteExisting }: AccountImportSessionInput) =>
      accountsService.importChatGptSessionAccount(
        sessionJson,
        overwriteExisting,
      ),
    onSuccess: (payload) => writeMutationPayload(payload),
  });

  const exportAccountsMutation = useMutation({
    mutationFn: ({ targetPath, accountKeys }: AccountExportFileInput) =>
      accountsService.exportAccountsToFile(targetPath, accountKeys),
    onSuccess: (payload) =>
      writeMutationPayload(payload, { invalidateDumpedQueries: false }),
  });

  const previewImportMutation = useMutation({
    mutationFn: ({ filePath }: AccountPreviewImportInput) =>
      accountsService.previewAccountImport(filePath),
    onSuccess: (payload) =>
      writeMutationPayload(payload, { invalidateDumpedQueries: false }),
  });

  const importFileMutation = useMutation({
    mutationFn: ({
      filePath,
      overwriteExisting,
      selectedKeys,
    }: AccountImportFileInput) =>
      accountsService.importAccountsFromFile(
        filePath,
        overwriteExisting,
        selectedKeys,
      ),
    onSuccess: (payload) => writeMutationPayload(payload),
  });

  const openPathMutation = useMutation({
    mutationFn: ({ path }: AccountOpenPathInput) => accountsService.openPath(path),
  });

  const refreshAccounts = () => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = Promise.all([
        snapshotQuery.refetch(),
        refreshUsageSnapshotMutation.mutateAsync(undefined),
      ])
        .then(() => undefined)
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }
    return refreshPromiseRef.current;
  };

  return {
    snapshotEnvelope: snapshotEnvelopeQuery.data,
    snapshotQuery,
    refreshUsageSnapshotAction: {
      id: "refresh-usage-snapshot",
      labelKey: "accounts.refreshUsageSnapshot",
      run: refreshAccounts,
      isPending: snapshotQuery.isFetching || refreshUsageSnapshotMutation.isPending,
    },
    attachMonitorAction: {
      id: "attach-monitor",
      labelKey: "accounts.beginAttachMonitor",
      run: () => attachMonitorMutation.mutateAsync(undefined),
      isPending: attachMonitorMutation.isPending,
    },
    switchAccount: {
      run: (input: AccountSwitchInput) => switchAccountMutation.mutateAsync(input),
      isPending: switchAccountMutation.isPending,
    },
    switchAccountAndRestart: {
      run: (input: AccountSwitchInput) =>
        switchAccountAndRestartMutation.mutateAsync(input),
      isPending: switchAccountAndRestartMutation.isPending,
    },
    removeAccounts: {
      run: (input: AccountKeysInput) => removeAccountsMutation.mutateAsync(input),
      isPending: removeAccountsMutation.isPending,
    },
    logout: {
      run: () => logoutMutation.mutateAsync(undefined),
      isPending: logoutMutation.isPending,
    },
    importChatGptSessionAccount: {
      run: (input: AccountImportSessionInput) =>
        importSessionMutation.mutateAsync(input),
      isPending: importSessionMutation.isPending,
    },
    exportAccountsToFile: {
      run: (input: AccountExportFileInput) =>
        exportAccountsMutation.mutateAsync(input),
      isPending: exportAccountsMutation.isPending,
    },
    previewAccountImport: {
      run: (input: AccountPreviewImportInput) =>
        previewImportMutation.mutateAsync(input),
      isPending: previewImportMutation.isPending,
    },
    importAccountsFromFile: {
      run: (input: AccountImportFileInput) => importFileMutation.mutateAsync(input),
      isPending: importFileMutation.isPending,
    },
    openPath: {
      run: (input: AccountOpenPathInput) => openPathMutation.mutateAsync(input),
      isPending: openPathMutation.isPending,
    },
  };
}
