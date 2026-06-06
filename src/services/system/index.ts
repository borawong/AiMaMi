import { invokeIpc } from "@/contracts/ipc";
import type {
  ApiModePayload,
  ApiProxyDetectPayload,
  ApiProxyMode,
  ApiProxyTestPayload,
  AutoSwitchConfigPayload,
  BootstrapStatePayload,
  CleanPayload,
  CoreEnvelope,
  CoreSnapshotPayload,
  DaemonRunPayload,
  DiagnosePayload,
  MysteryRouteGrant,
  NotificationClientStatePayload,
  PendingAutoSwitchStatePayload,
  RebuildRegistryPayload,
  SystemActionPayload,
  SystemInfoPayload,
  UpdateInstallabilityPayload,
} from "@/types";

async function ignoreEnvelope<T>(promise: Promise<CoreEnvelope<T>>): Promise<void> {
  await promise;
}

async function readEnvelopeData<T>(promise: Promise<CoreEnvelope<T>>): Promise<T> {
  return (await promise).data;
}

function toMysteryRouteGrantArgs(grants: MysteryRouteGrant[]) {
  return grants.map((grant) => ({
    route: grant.route,
    epochMs: grant.epochMs,
  }));
}

export const systemService = {
  loadSnapshot: (localOnly = false) =>
    invokeIpc<CoreEnvelope<CoreSnapshotPayload>>("load_snapshot", { localOnly }),

  refreshUsageSnapshot: () =>
    invokeIpc<CoreEnvelope<CoreSnapshotPayload>>("refresh_usage_snapshot"),

  loadBootstrapState: () =>
    invokeIpc<CoreEnvelope<BootstrapStatePayload>>("load_bootstrap_state"),

  clean: () => invokeIpc<CoreEnvelope<CleanPayload>>("clean"),

  rebuildRegistry: () =>
    invokeIpc<CoreEnvelope<RebuildRegistryPayload>>("rebuild_registry"),

  diagnose: () => invokeIpc<CoreEnvelope<DiagnosePayload>>("diagnose"),

  setAutoSwitch: (enabled: boolean) =>
    invokeIpc<CoreEnvelope<AutoSwitchConfigPayload>>("set_auto_switch", {
      enabled,
    }),

  configureAutoSwitch: (
    threshold5hPercent?: number,
    thresholdWeeklyPercent?: number,
  ) =>
    invokeIpc<CoreEnvelope<AutoSwitchConfigPayload>>("configure_auto_switch", {
      threshold5hPercent,
      thresholdWeeklyPercent,
    }),

  setApiProxyConfig: (mode: ApiProxyMode, url?: string | null) =>
    invokeIpc<CoreEnvelope<ApiModePayload>>("set_api_proxy_config", {
      mode,
      url,
    }),

  testApiProxyConfig: (mode: ApiProxyMode, url?: string | null) =>
    invokeIpc<CoreEnvelope<ApiProxyTestPayload>>("test_api_proxy_config", {
      mode,
      url,
    }),

  detectApiProxyConfig: () =>
    invokeIpc<CoreEnvelope<ApiProxyDetectPayload>>("detect_api_proxy_config"),

  runDaemonOnce: () =>
    invokeIpc<CoreEnvelope<DaemonRunPayload>>("run_daemon_once"),

  loadPendingAutoSwitch: () =>
    invokeIpc<CoreEnvelope<PendingAutoSwitchStatePayload>>(
      "load_pending_auto_switch",
    ),

  dismissPendingAutoSwitch: () =>
    invokeIpc<CoreEnvelope<string | null>>("dismiss_pending_auto_switch"),

  confirmPendingAutoSwitch: () =>
    ignoreEnvelope(invokeIpc<CoreEnvelope<null>>("confirm_pending_auto_switch")),

  confirmPendingAutoSwitchAndRestartCodex: () =>
    ignoreEnvelope(
      invokeIpc<CoreEnvelope<null>>(
        "confirm_pending_auto_switch_and_restart_codex",
      ),
    ),

  getUsageRefreshInterval: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<string>>("get_usage_refresh_interval")),

  setUsageRefreshInterval: (interval: string) =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<string>>("set_usage_refresh_interval", { interval }),
    ),

  checkUpdateInstallability: () =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<UpdateInstallabilityPayload>>(
        "check_update_installability",
      ),
    ),

  gracefulRestartForUpdate: () =>
    ignoreEnvelope(
      invokeIpc<CoreEnvelope<SystemActionPayload>>("graceful_restart_for_update"),
    ),

  restartCodex: () =>
    ignoreEnvelope(invokeIpc<CoreEnvelope<SystemActionPayload>>("restart_codex")),

  forceKillCodex: () =>
    ignoreEnvelope(invokeIpc<CoreEnvelope<SystemActionPayload>>("force_kill_codex")),

  resetCodexConfig: () =>
    ignoreEnvelope(invokeIpc<CoreEnvelope<SystemActionPayload>>("reset_codex_config")),

  openPath: (path: string) =>
    ignoreEnvelope(invokeIpc<CoreEnvelope<SystemActionPayload>>("open_path", { path })),

  getSystemInfo: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<SystemInfoPayload>>("get_system_info")),

  focusMainWindow: () =>
    ignoreEnvelope(invokeIpc<CoreEnvelope<SystemActionPayload>>("focus_main_window")),

  getDeviceId: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<string>>("get_device_id")),

  getNotificationClientState: () =>
    invokeIpc<CoreEnvelope<NotificationClientStatePayload>>(
      "get_notification_client_state",
    ),

  getMysteryUnlockGrants: () =>
    invokeIpc<CoreEnvelope<MysteryRouteGrant[]>>("get_mystery_unlock_grants"),

  mergeMysteryUnlockGrants: (grants: MysteryRouteGrant[]) =>
    invokeIpc<CoreEnvelope<MysteryRouteGrant[]>>("merge_mystery_unlock_grants", {
      grants: toMysteryRouteGrantArgs(grants),
    }),

  getOrCreateRemoteDeviceSecret: () =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<string>>("get_or_create_remote_device_secret"),
    ),

  importRemoteDeviceSecretIfEmpty: (secret: string) =>
    ignoreEnvelope(
      invokeIpc<CoreEnvelope<null>>("import_remote_device_secret_if_empty", {
        secret,
      }),
    ),

  hasNotch: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<boolean>>("has_notch")).catch(() => false),

  getHotspotEnabled: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<boolean>>("get_hotspot_enabled")),

  setHotspotEnabled: (enabled: boolean) =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<boolean>>("set_hotspot_enabled", { enabled }),
    ),

  hotspotReady: () =>
    ignoreEnvelope(invokeIpc<CoreEnvelope<boolean>>("hotspot_ready")),

  getImageCompat: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<boolean>>("get_image_compat")),

  setImageCompat: (enabled: boolean) =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<boolean>>("set_image_compat", { enabled }),
    ),
};
