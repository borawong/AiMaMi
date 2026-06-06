export type PluginEvidenceRecord = Record<string, unknown>;

export function selectPluginEnvelopeData(value: unknown) {
  return unwrapEnvelope(value);
}

export function selectPluginRecords(payload: unknown) {
  return readArray(payload, ["items", "plugins", "data.items"]);
}

export function countEnabledPlugins(plugins: unknown[]) {
  return plugins.filter((plugin) => readBoolean(plugin, ["enabled", "active"])).length;
}

export function readArray(value: unknown, paths: string[]) {
  if (Array.isArray(value)) return value;

  for (const path of paths) {
    const candidate = readPath(value, path);
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

export function readBoolean(value: unknown, paths: string[], fallback = false) {
  for (const path of paths) {
    const candidate = readPath(value, path);
    if (typeof candidate === "boolean") return candidate;
    if (typeof candidate === "number") return candidate !== 0;
    if (typeof candidate === "string") {
      if (candidate.toLowerCase() === "true") return true;
      if (candidate.toLowerCase() === "false") return false;
    }
  }

  return fallback;
}

export function readString(value: unknown, paths: string[], fallback = "") {
  for (const path of paths) {
    const candidate = readPath(value, path);
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }

  return fallback;
}

export function formatJsonDraft(value: unknown) {
  return formatJsonValue(value ?? null);
}

export function formatJsonSummary(value: unknown) {
  return formatJsonValue(value ?? null);
}

function unwrapEnvelope(value: unknown) {
  if (!isRecord(value)) return value;
  if ("data" in value) return value.data;
  if ("payload" in value) return value.payload;
  return value;
}

function readPath(value: unknown, path: string) {
  let current = value;
  for (const segment of path.split(".")) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function formatJsonValue(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "null";
  }
}

function isRecord(value: unknown): value is PluginEvidenceRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
