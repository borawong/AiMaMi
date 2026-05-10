import { useCallback, useEffect, useRef, useState } from "react";
import type { Update, DownloadEvent } from "@tauri-apps/plugin-updater";
import { useTranslation } from "react-i18next";
import type { UpdateInstallabilityPayload } from "@/types";
import { isTauriRuntime } from "@/lib/tauri-runtime";

interface UpdateInfo {
  version: string;
  currentVersion: string;
  body: string | null;
}

interface DownloadProgress {
  total: number;
  downloaded: number;
}

type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "installing" | "error";

export function useUpdateCheck() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateRef = useRef<Update | null>(null);

  const checkForUpdate = useCallback(async (): Promise<"available" | "up-to-date" | "error"> => {
    if (!isTauriRuntime()) {
      return "up-to-date";
    }
    setStatus("checking");
    setError(null);
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        updateRef.current = update;
        setUpdateInfo({
          version: update.version,
          currentVersion: update.currentVersion,
          body: update.body ?? null,
        });
        setStatus("available");
        return "available";
      }
      setStatus("idle");
      return "up-to-date";
    } catch (e) {
      setError(String(e));
      setStatus("error");
      return "error";
    }
  }, []);

  const installUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!update) return;

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const installability = await invoke<UpdateInstallabilityPayload>(
        "check_update_installability",
      );
      if (!installability.canInstall) {
        setError(localizeUpdateInstallabilityError(t, installability));
        setStatus("error");
        return;
      }

      setStatus("downloading");
      setProgress({ total: 0, downloaded: 0 });

      let totalBytes = 0;
      let downloadedBytes = 0;

      await update.downloadAndInstall((event: DownloadEvent) => {
        if (event.event === "Started" && event.data.contentLength) {
          totalBytes = event.data.contentLength;
          setProgress({ total: totalBytes, downloaded: 0 });
        } else if (event.event === "Progress") {
          downloadedBytes += event.data.chunkLength;
          setProgress({ total: totalBytes, downloaded: downloadedBytes });
        } else if (event.event === "Finished") {
          setStatus("installing");
        }
      });

      await invoke("graceful_restart_for_update");
    } catch (e) {
      setError(localizeUpdateRuntimeError(t, e));
      setStatus("error");
    }
  }, [t]);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    const timer = setTimeout(() => {
      checkForUpdate();
    }, 1500);
    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  const dismiss = useCallback(() => {
    setStatus("idle");
    setError(null);
    if (updateRef.current) {
      updateRef.current.close().catch(() => {});
      updateRef.current = null;
    }
  }, []);

  return {
    status,
    updateInfo,
    progress,
    error,
    checkForUpdate,
    installUpdate,
    dismiss,
  };
}

function localizeUpdateInstallabilityError(
  t: (key: string) => string,
  installability: UpdateInstallabilityPayload,
) {
  if (installability.code === "app_translocation") {
    return t("update.installBlockedAppTranslocation");
  }
  if (installability.code === "read_only_location") {
    return t("update.installBlockedReadOnlyLocation");
  }
  return t("update.installBlocked");
}

function localizeUpdateRuntimeError(t: (key: string) => string, error: unknown) {
  const message = String(error);
  if (
    message.includes("Read-only file system") ||
    message.includes("os error 30")
  ) {
    return t("update.installBlockedAppTranslocation");
  }
  return message;
}
