import { invokeIpc } from "@/contracts/ipc";
import {
  checkDesktopRuntimeUpdate,
  getDesktopAppVersion,
  type DesktopRuntimeUpdate,
} from "@/lib/desktop-adapter";
import type {
  ApiModePayload,
  ApiProxyDetectPayload,
  ApiProxyMode,
  ApiProxyTestPayload,
  AutoSwitchConfigPayload,
  CoreEnvelope,
  CoreSnapshotPayload,
  UpdateInstallabilityPayload,
} from "@/types";

export interface RuntimeUpdateInfo {
  version: string;
  currentVersion: string;
  body: string | null;
}

export interface RuntimeDownloadProgress {
  total: number;
  downloaded: number;
}

let pendingRuntimeUpdate: DesktopRuntimeUpdate | null = null;

async function readEnvelopeData<T>(promise: Promise<CoreEnvelope<T>>): Promise<T> {
  return (await promise).data;
}

export const settingsService = {
  loadSnapshot: (localOnly = false) =>
    invokeIpc<CoreEnvelope<CoreSnapshotPayload>>("load_snapshot", { localOnly }),

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

  getUsageRefreshInterval: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<string>>("get_usage_refresh_interval")),

  setUsageRefreshInterval: (interval: string) =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<string>>("set_usage_refresh_interval", { interval }),
    ),

  checkUpdateInstallability: async () => {
    const envelope = await invokeIpc<CoreEnvelope<UpdateInstallabilityPayload>>(
      "check_update_installability",
    );
    return envelope.data;
  },

  gracefulRestartForUpdate: async () => {
    await invokeIpc<CoreEnvelope<Record<string, never>>>(
      "graceful_restart_for_update",
    );
  },

  checkRuntimeUpdate: async (): Promise<RuntimeUpdateInfo | null> => {
    const update = await checkDesktopRuntimeUpdate();
    pendingRuntimeUpdate = update ?? null;
    return update
      ? {
          version: update.version,
          currentVersion: update.currentVersion,
          body: update.body ?? null,
        }
      : null;
  },

  installRuntimeUpdate: async (
    onProgress?: (progress: RuntimeDownloadProgress) => void,
  ) => {
    const update = pendingRuntimeUpdate;
    if (!update) return;

    await update.downloadAndInstall(onProgress);
  },

  dismissRuntimeUpdate: async () => {
    await pendingRuntimeUpdate?.close();
    pendingRuntimeUpdate = null;
  },

  getAppVersion: getDesktopAppVersion,

  hasNotch: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<boolean>>("has_notch")).catch(() => false),

  getHotspotEnabled: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<boolean>>("get_hotspot_enabled")),

  setHotspotEnabled: (enabled: boolean) =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<boolean>>("set_hotspot_enabled", { enabled }),
    ),

  hotspotReady: async () => {
    await invokeIpc<CoreEnvelope<unknown>>("hotspot_ready");
  },

  getImageCompat: () =>
    readEnvelopeData(invokeIpc<CoreEnvelope<boolean>>("get_image_compat")),

  setImageCompat: (enabled: boolean) =>
    readEnvelopeData(
      invokeIpc<CoreEnvelope<boolean>>("set_image_compat", { enabled }),
    ),
};
