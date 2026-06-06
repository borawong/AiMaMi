import {
  checkDesktopRuntimeUpdate,
  getDesktopAppVersion,
  type DesktopRuntimeUpdate,
} from "@/lib/desktop";
import { systemService } from "@/services/system";

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

export const settingsService = {
  loadSnapshot: systemService.loadSnapshot,

  setAutoSwitch: systemService.setAutoSwitch,

  configureAutoSwitch: systemService.configureAutoSwitch,

  setApiProxyConfig: systemService.setApiProxyConfig,

  testApiProxyConfig: systemService.testApiProxyConfig,

  detectApiProxyConfig: systemService.detectApiProxyConfig,

  getUsageRefreshInterval: systemService.getUsageRefreshInterval,

  setUsageRefreshInterval: systemService.setUsageRefreshInterval,

  checkUpdateInstallability: systemService.checkUpdateInstallability,

  gracefulRestartForUpdate: systemService.gracefulRestartForUpdate,

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

  hasNotch: systemService.hasNotch,

  getHotspotEnabled: systemService.getHotspotEnabled,

  setHotspotEnabled: systemService.setHotspotEnabled,

  hotspotReady: systemService.hotspotReady,

  getImageCompat: systemService.getImageCompat,

  setImageCompat: systemService.setImageCompat,
};
