import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { accountsService } from "@/services/accounts";
import { AccountsCache } from "../cache";
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
  const invalidateDumpedContractQueries = () => {
    void AccountsCache.invalidateContractQueries(queryClient);
    void queryClient.invalidateQueries({ queryKey: ["runtime-state", "display"] });
    void queryClient.invalidateQueries({ queryKey: ["quota-history"] });
  };
  const writeMutationPayload = (payload: unknown) => {
    AccountsCache.writeAuthoritativePayload(queryClient, {
      payload,
      source: "mutation-payload",
      sequence: Date.now(),
      receivedAt: Date.now(),
    });
    invalidateDumpedContractQueries();
  };

  const snapshotQuery = useQuery({
    queryKey: [...AccountsCache.queryKeys.root, "snapshot"],
    queryFn: () => api.loadSnapshot(true),
    staleTime: 30_000,
  });

  const attachMonitorMutation = useMutation({
    mutationFn: () => api.beginAddAccountAttachMonitor(),
    onSuccess: writeMutationPayload,
  });

  const refreshUsageSnapshotMutation = useMutation({
    mutationFn: () => accountsService.refreshUsageSnapshot(),
    onSuccess: writeMutationPayload,
  });

  const switchAccountMutation = useMutation({
    mutationFn: ({ accountKey }: AccountSwitchInput) =>
      api.switchAccount(accountKey),
    onSuccess: writeMutationPayload,
  });

  const switchAccountAndRestartMutation = useMutation({
    mutationFn: ({ accountKey }: AccountSwitchInput) =>
      api.switchAccountAndRestartCodex(accountKey),
    onSuccess: writeMutationPayload,
  });

  const removeAccountsMutation = useMutation({
    mutationFn: ({ accountKeys }: AccountKeysInput) =>
      api.removeAccounts(accountKeys),
    onSuccess: writeMutationPayload,
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: writeMutationPayload,
  });

  const importSessionMutation = useMutation({
    mutationFn: ({ sessionJson, overwriteExisting }: AccountImportSessionInput) =>
      api.importChatGptSessionAccount(
        sessionJson,
        overwriteExisting,
      ),
    onSuccess: writeMutationPayload,
  });

  const exportAccountsMutation = useMutation({
    mutationFn: ({ targetPath, accountKeys }: AccountExportFileInput) =>
      api.exportAccountsToFile(targetPath, accountKeys),
    onSuccess: writeMutationPayload,
  });

  const previewImportMutation = useMutation({
    mutationFn: ({ filePath }: AccountPreviewImportInput) =>
      api.previewAccountImport(filePath),
    onSuccess: writeMutationPayload,
  });

  const importFileMutation = useMutation({
    mutationFn: ({
      filePath,
      overwriteExisting,
      selectedKeys,
    }: AccountImportFileInput) =>
      api.importAccountsFromFile(
        filePath,
        overwriteExisting,
        selectedKeys,
      ),
    onSuccess: writeMutationPayload,
  });

  const openPathMutation = useMutation({
    mutationFn: ({ path }: AccountOpenPathInput) => accountsService.openPath(path),
  });

  return {
    snapshotQuery,
    refreshUsageSnapshotAction: {
      id: "refresh-usage-snapshot",
      labelKey: "accounts.refreshUsageSnapshot",
      run: () => refreshUsageSnapshotMutation.mutateAsync(),
      isPending: refreshUsageSnapshotMutation.isPending,
    },
    attachMonitorAction: {
      id: "attach-monitor",
      labelKey: "accounts.beginAttachMonitor",
      run: () => attachMonitorMutation.mutateAsync(),
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
      run: () => logoutMutation.mutateAsync(),
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
