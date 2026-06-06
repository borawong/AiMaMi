import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import { useModuleCacheController } from "@/features/_shared/controller";
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
  AccountPlanFilter,
  AccountOpenPathInput,
  AccountPreviewImportInput,
  AccountRecord,
  AccountSwitchInput,
} from "../types";
import { ACCOUNT_PLAN_FILTERS } from "../types";
import {
  accountEmail,
  accountKey,
  accountPlan,
  envelopeData,
  isActiveAccount,
  readArray,
  readString,
} from "../utils";

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

export type AccountsModuleController = ReturnType<typeof useAccountsModule>;

export interface AccountsPageController {
  module: AccountsModuleController;
  query: string;
  setQuery: (query: string) => void;
  planFilter: AccountPlanFilter;
  setPlanFilter: (planFilter: AccountPlanFilter) => void;
  planFilters: readonly AccountPlanFilter[];
  accounts: AccountRecord[];
  filteredAccounts: AccountRecord[];
  selectedKey: string | null;
  effectiveSelectedKey: string;
  selectedAccount: AccountRecord | null;
  activeAccount: AccountRecord | null;
  apiReachability: string;
  loading: boolean;
  error: unknown;
  isFetching: boolean;
  isRefreshing: boolean;
  selectAccount: (accountKey: string) => void;
  refresh: () => Promise<void>;
}

// 中文职责说明：页面 controller owning accounts 快照派生、筛选状态和选择回退，route shell 只负责装配。
export function useAccountsPageController(): AccountsPageController {
  const module = useAccountsModule();
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<AccountPlanFilter>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const snapshotPayload =
    module.snapshotEnvelope?.payload ??
    (module.snapshotEnvelope ? null : module.snapshotQuery.data);

  const snapshot = useMemo(() => envelopeData(snapshotPayload), [snapshotPayload]);
  const accounts = useMemo(
    () =>
      readArray<AccountRecord>(snapshot, [
        "accounts",
        "items",
        "registry.accounts",
        "accountList",
      ]),
    [snapshot],
  );

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return accounts
      .slice()
      .sort((left, right) => {
        const activeDelta =
          Number(isActiveAccount(right)) - Number(isActiveAccount(left));
        if (activeDelta !== 0) return activeDelta;
        return accountEmail(left).localeCompare(accountEmail(right));
      })
      .filter((account) => {
        const plan = accountPlan(account);
        const matchesPlan = planFilter === "all" || plan === planFilter;
        if (!matchesPlan) return false;
        if (!normalizedQuery) return true;
        return [
          accountEmail(account),
          accountKey(account),
          readString(account, ["alias"], ""),
          readString(account, ["accountName"], ""),
          readString(account, ["workspaceName"], ""),
          readString(account, ["profileName"], ""),
        ].some((item) => item.toLowerCase().includes(normalizedQuery));
      });
  }, [accounts, planFilter, query]);

  const effectiveSelectedKey =
    selectedKey &&
    filteredAccounts.some((account) => accountKey(account) === selectedKey)
      ? selectedKey
      : accountKey(filteredAccounts[0]);
  const selectedAccount =
    filteredAccounts.find(
      (account) => accountKey(account) === effectiveSelectedKey,
    ) ?? null;
  const activeAccount = accounts.find(isActiveAccount) ?? null;
  const apiReachability = readString(
    snapshot,
    [
      "status.apiConnectivity.usageStatus",
      "status.api.usageStatus",
      "apiConnectivity.usageStatus",
    ],
    "unknown",
  );
  const isFetching = module.snapshotQuery.isFetching;
  const isRefreshing = module.refreshUsageSnapshotAction.isPending;
  const loading =
    !snapshotPayload && (module.snapshotQuery.isLoading || isFetching);
  const error = module.snapshotQuery.isError ? module.snapshotQuery.error : null;

  return {
    module,
    query,
    setQuery,
    planFilter,
    setPlanFilter,
    planFilters: ACCOUNT_PLAN_FILTERS,
    accounts,
    filteredAccounts,
    selectedKey,
    effectiveSelectedKey,
    selectedAccount,
    activeAccount,
    apiReachability,
    loading,
    error,
    isFetching,
    isRefreshing,
    selectAccount: setSelectedKey,
    refresh: module.refreshUsageSnapshotAction.run,
  };
}
