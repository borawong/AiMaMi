import { useDaemonAutoswitchPageMutations } from "./mutation";
import {
  useDaemonAutoswitchBootstrapQuery,
  useDaemonAutoswitchPageQueries,
  useDaemonAutoswitchPendingQuery,
} from "./query";
import { useDaemonAutoswitchRuntimeSubscriptions } from "./runtime";
import type {
  DaemonAutoswitchMetricModel,
  DaemonAutoswitchModuleController,
  DaemonAutoswitchPageController,
  DaemonAutoswitchPanelModel,
  DaemonAutoswitchPendingPromptController,
} from "../types";
import type {
  BootstrapStatePayload,
  PendingAutoSwitchStatePayload,
} from "@/types";
import { envelopeData, readBoolean, readString } from "../utils";

export function useDaemonAutoswitchPendingPrompt(): DaemonAutoswitchPendingPromptController {
  const queries = useDaemonAutoswitchPageQueries();
  const mutations = useDaemonAutoswitchPageMutations();
  useDaemonAutoswitchRuntimeSubscriptions();

  return {
    pendingQuery: queries.pendingQuery,
    dismissPendingAction: {
      id: "dismiss-pending",
      labelKey: "daemonAutoswitch.dismissPending",
      run: () => mutations.dismissPendingMutation.mutateAsync(),
      isPending: mutations.dismissPendingMutation.isPending,
    },
    confirmPendingAndRestartAction: {
      id: "confirm-pending-restart",
      labelKey: "daemonAutoswitch.confirmPendingRestart",
      run: () => mutations.confirmPendingAndRestartMutation.mutateAsync(),
      isPending: mutations.confirmPendingAndRestartMutation.isPending,
    },
  };
}

export function useDaemonAutoswitchModule(): DaemonAutoswitchModuleController {
  const bootstrapQuery = useDaemonAutoswitchBootstrapQuery();
  const pendingQuery = useDaemonAutoswitchPendingQuery();
  const mutations = useDaemonAutoswitchPageMutations();
  const runtimeSubscriptions = useDaemonAutoswitchRuntimeSubscriptions();

  return {
    bootstrapQuery,
    pendingQuery,
    runtimeSubscriptions,
    runOnceAction: {
      id: "run-once",
      labelKey: "daemonAutoswitch.runOnce",
      run: () => mutations.runOnceMutation.mutateAsync(),
      isPending: mutations.runOnceMutation.isPending,
    },
    setAutoSwitchAction: {
      run: (enabled: boolean) =>
        mutations.setAutoSwitchMutation.mutateAsync(enabled),
      isPending: mutations.setAutoSwitchMutation.isPending,
    },
  };
}

export function useDaemonAutoswitchPageController(): DaemonAutoswitchPageController {
  const module = useDaemonAutoswitchModule();
  const bootstrap = envelopeData<BootstrapStatePayload>(module.bootstrapQuery.data);
  const pending = envelopeData<PendingAutoSwitchStatePayload>(
    module.pendingQuery.data,
  );
  const enabled = readBoolean(bootstrap, ["autoSwitchEnabled"]);
  const pendingAccountKey = readString(bootstrap, ["pendingSwitchAccountKey"], "");
  const executedAt = readString(bootstrap, ["executedAt"], "");
  const executedAtEpoch = executedAt ? Date.parse(executedAt) : 0;

  const metrics: DaemonAutoswitchMetricModel[] = [
    {
      id: "enabled",
      labelKey: "daemonAutoswitch.enabled",
      value: {
        kind: "badge",
        value: enabled,
        trueKey: "overview.enabled",
        falseKey: "overview.disabled",
      },
    },
    {
      id: "service-state",
      labelKey: "daemonAutoswitch.serviceState",
      value: {
        kind: "text",
        icon: "activity",
        value: pendingAccountKey || "-",
      },
    },
    {
      id: "written-at",
      labelKey: "daemonAutoswitch.writtenAt",
      value: {
        kind: "time",
        icon: "clock",
        value: Number.isFinite(executedAtEpoch) ? executedAtEpoch : 0,
      },
    },
  ];

  const panels: DaemonAutoswitchPanelModel[] = [
    {
      id: "bootstrap",
      titleKey: "daemonAutoswitch.bootstrap",
      state: module.bootstrapQuery,
      payload: bootstrap,
      icon: "toggle",
    },
    {
      id: "pending",
      titleKey: "daemonAutoswitch.pending",
      state: module.pendingQuery,
      payload: pending,
    },
  ];

  return {
    metrics,
    panels,
  };
}
