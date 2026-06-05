import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { accountsService } from "@/services/accounts";
import { systemService } from "@/services/system";
import { AccountsCache } from "../cache";
import type {
  AccountExportFileInput,
  AccountImportFileInput,
  AccountImportSessionInput,
  AccountKeysInput,
  AccountPreviewImportInput,
  AccountSwitchInput,
} from "../types";

export function useAccountsCacheController() {
  return useModuleCacheController(AccountsCache);
}

export function useAccountsModule() {
  const queryClient = useQueryClient();
  const writeMutationPayload = (payload: unknown) => {
    AccountsCache.writeAuthoritativePayload(queryClient, {
      payload,
      source: "mutation-payload",
      sequence: Date.now(),
      receivedAt: Date.now(),
    });
    void AccountsCache.invalidateContractQueries(queryClient);
  };

  const snapshotQuery = useQuery({
    queryKey: [...AccountsCache.queryKeys.root, "snapshot"],
    queryFn: () => systemService.loadSnapshot(true),
    staleTime: 30_000,
  });

  const attachMonitorMutation = useMutation({
    mutationFn: () => accountsService.beginAddAccountAttachMonitor(),
    onSuccess: writeMutationPayload,
  });

  const switchAccountMutation = useMutation({
    mutationFn: ({ accountKey }: AccountSwitchInput) =>
      accountsService.switchAccount(accountKey),
    onSuccess: writeMutationPayload,
  });

  const switchAccountAndRestartMutation = useMutation({
    mutationFn: ({ accountKey }: AccountSwitchInput) =>
      accountsService.switchAccountAndRestartCodex(accountKey),
    onSuccess: writeMutationPayload,
  });

  const removeAccountsMutation = useMutation({
    mutationFn: ({ accountKeys }: AccountKeysInput) =>
      accountsService.removeAccounts(accountKeys),
    onSuccess: writeMutationPayload,
  });

  const logoutMutation = useMutation({
    mutationFn: () => accountsService.logout(),
    onSuccess: writeMutationPayload,
  });

  const importSessionMutation = useMutation({
    mutationFn: ({ sessionJson, overwriteExisting }: AccountImportSessionInput) =>
      accountsService.importChatGptSessionAccount(
        sessionJson,
        overwriteExisting,
      ),
    onSuccess: writeMutationPayload,
  });

  const exportAccountsMutation = useMutation({
    mutationFn: ({ targetPath, accountKeys }: AccountExportFileInput) =>
      accountsService.exportAccountsToFile(targetPath, accountKeys),
    onSuccess: writeMutationPayload,
  });

  const previewImportMutation = useMutation({
    mutationFn: ({ filePath }: AccountPreviewImportInput) =>
      accountsService.previewAccountImport(filePath),
    onSuccess: writeMutationPayload,
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
    onSuccess: writeMutationPayload,
  });

  return {
    snapshotQuery,
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
  };
}
