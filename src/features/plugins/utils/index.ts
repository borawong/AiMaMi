import type {
  PluginsIpcPayload,
  PluginsListEnvelope,
  PluginsPluginRecord,
  PluginsSettingsValue,
  PluginsToggleEnvelope,
} from "../types";

export function selectPluginEnvelopeData(
  value: PluginsListEnvelope | PluginsToggleEnvelope | undefined,
) {
  return value?.data ?? null;
}

export function selectPluginRecords(payload: PluginsIpcPayload | null) {
  if (!payload || !("items" in payload)) return [];
  return payload.items;
}

export function countEnabledPlugins(plugins: PluginsPluginRecord[]) {
  return plugins.filter((plugin) => plugin.enabled).length;
}

export function readPluginTitle(plugin: PluginsPluginRecord, fallback: string) {
  return plugin.title || plugin.name || plugin.id || fallback;
}

export function readPluginDescription(plugin: PluginsPluginRecord) {
  return plugin.description || plugin.path || "";
}

export function formatJsonDraft(value: PluginsSettingsValue | undefined) {
  return formatJsonValue(value ?? null);
}

export function formatJsonSummary(value: PluginsSettingsValue | undefined) {
  return formatJsonValue(value ?? null);
}

function formatJsonValue(value: PluginsSettingsValue) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "null";
  }
}
