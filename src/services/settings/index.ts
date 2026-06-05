import { invokeIpc } from "@/contracts/ipc";
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
import type { DownloadEvent, Update } from "@tauri-apps/plugin-updater";

export interface RuntimeUpdateInfo {
  version: string;
  currentVersion: string;
  body: string | null;
}

export interface RuntimeDownloadProgress {
  total: number;
  downloaded: number;
}

let pendingRuntimeUpdate: Update | null = null;

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
    invokeIpc<string>("get_usage_refresh_interval"),

  setUsageRefreshInterval: (interval: string) =>
    invokeIpc<string>("set_usage_refresh_interval", { interval }),

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
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
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

    let totalBytes = 0;
    let downloadedBytes = 0;
    await update.downloadAndInstall((event: DownloadEvent) => {
      if (event.event === "Started" && event.data.contentLength) {
        totalBytes = event.data.contentLength;
        downloadedBytes = 0;
        onProgress?.({ total: totalBytes, downloaded: 0 });
      } else if (event.event === "Progress") {
        downloadedBytes += event.data.chunkLength;
        onProgress?.({ total: totalBytes, downloaded: downloadedBytes });
      }
    });
  },

  dismissRuntimeUpdate: async () => {
    await pendingRuntimeUpdate?.close();
    pendingRuntimeUpdate = null;
  },

  getAppVersion: async () => {
    const { getVersion } = await import("@tauri-apps/api/app");
    return getVersion();
  },

  hasNotch: () => invokeIpc<boolean>("has_notch").catch(() => false),

  getHotspotEnabled: () => invokeIpc<boolean>("get_hotspot_enabled"),

  setHotspotEnabled: (enabled: boolean) =>
    invokeIpc<boolean>("set_hotspot_enabled", { enabled }),

  hotspotReady: () => invokeIpc<void>("hotspot_ready"),

  getImageCompat: () => invokeIpc<boolean>("get_image_compat"),

  setImageCompat: (enabled: boolean) =>
    invokeIpc<boolean>("set_image_compat", { enabled }),
};
