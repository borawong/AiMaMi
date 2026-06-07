import type { QueryClient } from "@tanstack/react-query";
import { systemService } from "@/services/system";

const REMOTE_DEVICE_SECRET_STORAGE_KEY = "remote_device_secret_v1";
export const REMOTE_DEVICE_SECRET_QUERY_KEY = [
  "runtime",
  "remote-device-secret",
] as const;

let startupRemoteDeviceSecretPromise: Promise<string | null> | null = null;

// 启动迁移只把旧缓存交给后端，不向界面暴露成功或失败。
export function ensureRuntimeRemoteDeviceSecret(
  queryClient: QueryClient,
): Promise<string | null> {
  startupRemoteDeviceSecretPromise ??= migrateRuntimeRemoteDeviceSecret();
  return startupRemoteDeviceSecretPromise.then((secret) => {
    queryClient.setQueryData<string | null>(
      REMOTE_DEVICE_SECRET_QUERY_KEY,
      secret,
    );
    return secret;
  });
}

async function migrateRuntimeRemoteDeviceSecret(): Promise<string | null> {
  await importLegacyRemoteDeviceSecretIfPresent();
  return readBackendRemoteDeviceSecret();
}

async function importLegacyRemoteDeviceSecretIfPresent(): Promise<void> {
  const legacySecret = readLegacyRemoteDeviceSecret();
  if (!legacySecret) {
    return;
  }

  try {
    await systemService.importRemoteDeviceSecretIfEmpty(legacySecret);
  } catch {
    // 导入失败不阻塞启动，旧值仍按迁移链路清理。
  } finally {
    clearLegacyRemoteDeviceSecret();
  }
}

async function readBackendRemoteDeviceSecret(): Promise<string | null> {
  return systemService.getOrCreateRemoteDeviceSecret().catch(() => null);
}

function readLegacyRemoteDeviceSecret(): string {
  try {
    if (typeof localStorage === "undefined") {
      return "";
    }

    return localStorage.getItem(REMOTE_DEVICE_SECRET_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

function clearLegacyRemoteDeviceSecret() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(REMOTE_DEVICE_SECRET_STORAGE_KEY);
    }
  } catch {
    // 清理失败不影响后续后端 secret 初始化。
  }
}
