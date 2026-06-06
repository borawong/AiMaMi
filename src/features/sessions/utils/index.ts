/**
 * 中文职责说明：sessions 模块本地 selector/formatter 只解包会话和用量 envelope，不拥有业务状态。
 */
export type SessionEvidenceRecord = Record<string, unknown>;

export function selectSessionsEnvelopeData(value: unknown) {
  return unwrapEnvelope(value);
}

export function selectSessionRecords(payload: unknown) {
  return readArray(payload, ["items", "sessions", "data.items"]);
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

export function readNumber(value: unknown, paths: string[], fallback = 0) {
  for (const path of paths) {
    const candidate = readPath(value, path);
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === "string") {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) return parsed;
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

export function formatSessionTime(value: number) {
  if (!value) return "";
  const date = new Date(value > 10_000_000_000 ? value : value * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
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

function isRecord(value: unknown): value is SessionEvidenceRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
