import type { DownloadEvent, Update } from "@tauri-apps/plugin-updater";

export interface DesktopDownloadProgress {
  total: number;
  downloaded: number;
}

export interface DesktopRuntimeUpdate {
  version: string;
  currentVersion: string;
  body: string | null;
  downloadAndInstall: (
    onProgress?: (progress: DesktopDownloadProgress) => void,
  ) => Promise<void>;
  close: () => Promise<void>;
}

// 桌面适配器只封装 Tauri 插件和系统能力，不保存业务状态。
export async function checkDesktopRuntimeUpdate(): Promise<DesktopRuntimeUpdate | null> {
  const { check } = await import("@tauri-apps/plugin-updater");
  const update = await check();
  return update ? createDesktopRuntimeUpdate(update) : null;
}

export async function getDesktopAppVersion(): Promise<string> {
  const { getVersion } = await import("@tauri-apps/api/app");
  return getVersion();
}

export async function pickDesktopDirectory(): Promise<string | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const path = await open({ directory: true });
  return typeof path === "string" ? path : null;
}

function createDesktopRuntimeUpdate(update: Update): DesktopRuntimeUpdate {
  return {
    version: update.version,
    currentVersion: update.currentVersion,
    body: update.body ?? null,
    downloadAndInstall: async (onProgress) => {
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
    close: () => update.close(),
  };
}
