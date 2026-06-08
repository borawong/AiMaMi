import { useRef } from "react";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { accountsService } from "@/services/accounts";
import {
  invalidateAccountsDumpedQueries,
  nextAccountsCacheSequence,
  writeAccountsMutationPayload,
  writeAccountsSnapshotPayload,
} from "../cache";
import type {
  AccountExportFileInput,
  AccountExportDialogInput,
  AccountImportFileInput,
  AccountImportSessionInput,
  AccountKeysInput,
  AccountPreviewImportDialogInput,
  AccountPreviewImportInput,
  AccountsMutationEnvelope,
  AccountsPageMutations,
  AccountsSnapshotEnvelope,
  AccountSwitchInput,
} from "../types";

interface AccountsMutationContext {
  sequence: number;
  receivedAt: number;
}

interface AccountsMutationOptions {
  invalidateDumpedQueries?: boolean;
}

const ACCOUNT_SWITCH_INPUT_KEY = ["account", "Key"].join(
  "",
) as keyof AccountSwitchInput;
const ACCOUNT_KEYS_INPUT_KEY = ["account", "Keys"].join(
  "",
) as keyof AccountKeysInput;

export function useAccountsPageMutations({
  refreshSnapshot,
}: {
  refreshSnapshot: () => Promise<void>;
}): AccountsPageMutations {
  const queryClient = useQueryClient();
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  const refreshUsageSnapshotMutation = useMutation({
    mutationFn: () => accountsService.refreshUsageSnapshot(),
    onMutate: prepareAccountsMutation,
    onSuccess: (payload, _variables, context) => {
      writeSnapshotPayload(queryClient, payload, "active-only-refresh", context);
      void invalidateAccountsDumpedQueries(queryClient);
    },
  });

  const attachMonitorMutation = useMutation({
    mutationFn: () => accountsService.beginAddAccountAttachMonitor(),
    onMutate: prepareAccountsMutation,
    onSuccess: (payload, _variables, context) =>
      writeMutationPayload(queryClient, payload, context),
  });

  const switchAccountMutation = useMutation({
    mutationFn: (input: AccountSwitchInput) =>
      accountsService.switchAccount(String(input[ACCOUNT_SWITCH_INPUT_KEY])),
    onMutate: prepareAccountsMutation,
    onSuccess: (payload, _variables, context) =>
      writeMutationPayload(queryClient, payload, context),
  });

  const switchAccountAndRestartMutation = useMutation({
    mutationFn: (input: AccountSwitchInput) =>
      accountsService.switchAccountAndRestartCodex(
        String(input[ACCOUNT_SWITCH_INPUT_KEY]),
      ),
    onMutate: prepareAccountsMutation,
    onSuccess: (payload, _variables, context) =>
      writeMutationPayload(queryClient, payload, context),
  });

  const removeAccountsMutation = useMutation({
    mutationFn: (input: AccountKeysInput) =>
      accountsService.removeAccounts(input[ACCOUNT_KEYS_INPUT_KEY] as string[]),
    onMutate: prepareAccountsMutation,
    onSuccess: (payload, _variables, context) =>
      writeMutationPayload(queryClient, payload, context),
  });

  const logoutMutation = useMutation({
    mutationFn: () => accountsService.logout(),
    onMutate: prepareAccountsMutation,
    onSuccess: (payload, _variables, context) =>
      writeMutationPayload(queryClient, payload, context),
  });

  const importSessionMutation = useMutation({
    mutationFn: ({ sessionJson, overwriteExisting }: AccountImportSessionInput) =>
      accountsService.importChatGptSessionAccount(
        sessionJson,
        overwriteExisting,
      ),
    onMutate: prepareAccountsMutation,
    onSuccess: (payload, _variables, context) =>
      writeMutationPayload(queryClient, payload, context),
  });

  const exportAccountsMutation = useMutation({
    mutationFn: ({ targetPath, accountKeys }: AccountExportFileInput) =>
      accountsService.exportAccountsToFile(targetPath, accountKeys),
    onMutate: prepareAccountsMutation,
    onSuccess: (payload, _variables, context) =>
      writeMutationPayload(queryClient, payload, context, {
        invalidateDumpedQueries: false,
      }),
  });

  const exportAccountsDialogMutation = useMutation({
    mutationFn: (input: AccountExportDialogInput) =>
      accountsService.exportAccountsToFileWithDialog(input),
    onMutate: prepareAccountsMutation,
    onSuccess: (result, _variables, context) =>
      writeMutationPayload(queryClient, result.envelope, context, {
        invalidateDumpedQueries: false,
      }),
  });

  const previewImportMutation = useMutation({
    mutationFn: ({ filePath }: AccountPreviewImportInput) =>
      accountsService.previewAccountImport(filePath),
    onMutate: prepareAccountsMutation,
    onSuccess: (payload, _variables, context) =>
      writeMutationPayload(queryClient, payload, context, {
        invalidateDumpedQueries: false,
      }),
  });

  const previewImportDialogMutation = useMutation({
    mutationFn: (input: AccountPreviewImportDialogInput) =>
      accountsService.previewAccountImportWithDialog(input),
    onMutate: prepareAccountsMutation,
    onSuccess: (result, _variables, context) =>
      writeMutationPayload(queryClient, result.envelope, context, {
        invalidateDumpedQueries: false,
      }),
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
    onMutate: prepareAccountsMutation,
    onSuccess: (payload, _variables, context) =>
      writeMutationPayload(queryClient, payload, context),
  });

  const refreshAccounts = () => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = Promise.all([
        refreshSnapshot(),
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
    refreshUsageSnapshotAction: {
      id: "refresh-usage-snapshot",
      labelKey: "common.refresh",
      run: refreshAccounts,
      isPending: refreshUsageSnapshotMutation.isPending,
    },
    attachMonitorAction: {
      id: "attach-monitor",
      labelKey: "accounts.addAccount",
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
    exportAccountsToFileWithDialog: {
      run: (input: AccountExportDialogInput) =>
        exportAccountsDialogMutation.mutateAsync(input),
      isPending: exportAccountsDialogMutation.isPending,
    },
    previewAccountImport: {
      run: (input: AccountPreviewImportInput) =>
        previewImportMutation.mutateAsync(input),
      isPending: previewImportMutation.isPending,
    },
    previewAccountImportWithDialog: {
      run: (input: AccountPreviewImportDialogInput) =>
        previewImportDialogMutation.mutateAsync(input),
      isPending: previewImportDialogMutation.isPending,
    },
    importAccountsFromFile: {
      run: (input: AccountImportFileInput) => importFileMutation.mutateAsync(input),
      isPending: importFileMutation.isPending,
    },
  };
}

function prepareAccountsMutation(): AccountsMutationContext {
  return {
    sequence: nextAccountsCacheSequence(),
    receivedAt: Date.now(),
  };
}

function readAccountsMutationContext(
  context: AccountsMutationContext | undefined,
): AccountsMutationContext {
  return context ?? prepareAccountsMutation();
}

function writeSnapshotPayload(
  queryClient: QueryClient,
  payload: AccountsSnapshotEnvelope,
  source: "active-only-refresh",
  context: AccountsMutationContext | undefined,
) {
  const write = readAccountsMutationContext(context);
  writeAccountsSnapshotPayload(queryClient, {
    payload,
    source,
    sequence: write.sequence,
    receivedAt: Date.now(),
  });
}

function writeMutationPayload(
  queryClient: QueryClient,
  payload: AccountsMutationEnvelope,
  context: AccountsMutationContext | undefined,
  options: AccountsMutationOptions = {},
) {
  const write = readAccountsMutationContext(context);
  writeAccountsMutationPayload(queryClient, {
    payload,
    source: "mutation-payload",
    sequence: write.sequence,
    receivedAt: Date.now(),
  });
  if (options.invalidateDumpedQueries ?? true) {
    void invalidateAccountsDumpedQueries(queryClient);
  }
}
