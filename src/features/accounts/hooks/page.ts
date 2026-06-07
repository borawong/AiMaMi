import { useMemo, useState } from "react";
import type {
  AccountPlanFilter,
  AccountRecord,
  AccountsModuleController,
  AccountsPageController,
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
import { useAccountsPathActions } from "./action";
import { useAccountsPageMutations } from "./mutation";
import { useAccountsPageQueries } from "./query";

export function useAccountsModule(): AccountsModuleController {
  const queries = useAccountsPageQueries();
  const mutations = useAccountsPageMutations({
    refreshSnapshot: queries.refreshSnapshot,
  });
  const pathActions = useAccountsPathActions();

  return {
    snapshotEnvelope: queries.snapshotEnvelope,
    snapshotQuery: queries.snapshotQuery,
    ...mutations,
    ...pathActions,
    refreshUsageSnapshotAction: {
      ...mutations.refreshUsageSnapshotAction,
      isPending:
        queries.snapshotQuery.isFetching ||
        mutations.refreshUsageSnapshotAction.isPending,
    },
  };
}

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
