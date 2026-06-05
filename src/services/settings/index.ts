/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: services/settings
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { invokeIpc } from "@/contracts/ipc";
import type {
  ApiModePayload,
  ApiProxyDetectPayload,
  ApiProxyMode,
  ApiProxyTestPayload,
  CoreEnvelope,
  UpdateInstallabilityPayload,
} from "@/types";

export const settingsService = {
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

  checkUpdateInstallability: () =>
    invokeIpc<UpdateInstallabilityPayload>("check_update_installability"),

  gracefulRestartForUpdate: () =>
    invokeIpc<void>("graceful_restart_for_update"),

  hasNotch: () => invokeIpc<boolean>("has_notch").catch(() => false),

  getHotspotEnabled: () => invokeIpc<boolean>("get_hotspot_enabled"),

  setHotspotEnabled: (enabled: boolean) =>
    invokeIpc<boolean>("set_hotspot_enabled", { enabled }),

  hotspotReady: () => invokeIpc<void>("hotspot_ready"),

  getImageCompat: () => invokeIpc<boolean>("get_image_compat"),

  setImageCompat: (enabled: boolean) =>
    invokeIpc<boolean>("set_image_compat", { enabled }),
};
