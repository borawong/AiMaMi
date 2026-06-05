import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { UpdateInstallabilityPayload } from "@/types";
import { isTauriRuntime } from "@/lib/tauri-runtime";
import { api } from "@/lib/api";

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
  const hasPendingUpdateRef = useRef(false);

  const checkForUpdate = useCallback(async (): Promise<"available" | "up-to-date" | "error"> => {
    if (!isTauriRuntime()) {
      return "up-to-date";
    }
    setStatus("checking");
    setError(null);
    try {
      const update = await api.checkRuntimeUpdate();
      if (update) {
        hasPendingUpdateRef.current = true;
        setUpdateInfo(update);
        setStatus("available");
        return "available";
      }
      hasPendingUpdateRef.current = false;
      setStatus("idle");
      return "up-to-date";
    } catch (e) {
      setError(String(e));
      setStatus("error");
      return "error";
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!hasPendingUpdateRef.current) return;

    try {
      const installability = await api.checkUpdateInstallability();
      if (!installability.canInstall) {
        setError(localizeUpdateInstallabilityError(t, installability));
        setStatus("error");
        return;
      }

      setStatus("downloading");
      setProgress({ total: 0, downloaded: 0 });

      await api.installRuntimeUpdate((nextProgress) => {
        setProgress(nextProgress);
      });

      setStatus("installing");
      await api.gracefulRestartForUpdate();
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
    hasPendingUpdateRef.current = false;
    api.dismissRuntimeUpdate().catch(() => {});
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
