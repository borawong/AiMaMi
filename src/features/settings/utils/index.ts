/**
 * 中文职责说明：settings 模块展示格式与窄类型守卫 owner，不触碰 IPC 或服务状态。
 */
import { REFRESH_OPTIONS, type RefreshInterval } from "@/hooks/use-auto-refresh";
import type { ApiProxyMode, ApiProxyTestPayload } from "@/types";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function isSettingsRefreshInterval(value: unknown): value is RefreshInterval {
  return (
    typeof value === "string" &&
    REFRESH_OPTIONS.some((item) => item.value === value)
  );
}

export function settingsProxyModeBadgeLabel(t: TranslateFn, mode: ApiProxyMode) {
  return mode === "manual"
    ? t("settings.apiProxyModeManual")
    : t("settings.apiProxyModeDirect");
}

export function formatSettingsProxyTestResult(
  t: TranslateFn,
  mode: ApiProxyMode,
  result: ApiProxyTestPayload,
) {
  if (result.reachable) {
    return mode === "manual"
      ? t("settings.apiProxyTestReachableManual")
      : t("settings.apiProxyTestReachableDirect");
  }

  switch (result.code) {
    case "not_found":
      return t("settings.apiProxyDetectFailed");
    case "invalid_config":
      return t("settings.apiProxyTestInvalidConfig");
    case "client_build_failed":
      return t("settings.apiProxyTestClientBuildFailed");
    case "network_error":
      return t("settings.apiProxyTestNetworkFailed");
    default:
      return t("settings.apiProxyTestFailed");
  }
}

export function formatSettingsProxySaveError(t: TranslateFn, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("Manual proxy mode requires a proxy URL") ||
    message.includes("Invalid proxy URL") ||
    message.includes("Unsupported proxy scheme")
  ) {
    return t("settings.apiProxyTestInvalidConfig");
  }

  return message;
}
