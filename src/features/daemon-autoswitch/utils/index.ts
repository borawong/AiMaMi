export type DaemonAutoswitchUnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is DaemonAutoswitchUnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function envelopeData<T = unknown>(value: unknown): T | null {
  if (!isRecord(value)) return (value ?? null) as T | null;
  if ("data" in value) return (value.data ?? null) as T | null;
  return value as T;
}

export function readRecordField(value: unknown, key: string): unknown {
  if (!isRecord(value)) return null;
  return value[key] ?? null;
}

export function readPath(value: unknown, path: string): unknown {
  return path
    .split(".")
    .filter(Boolean)
    .reduce<unknown>((cursor, segment) => {
      if (!isRecord(cursor)) return undefined;
      return cursor[segment];
    }, value);
}

export function firstPath(value: unknown, paths: string[]): unknown {
  for (const path of paths) {
    const current = readPath(value, path);
    if (current !== undefined && current !== null) return current;
  }
  return undefined;
}

export function readBoolean(value: unknown, paths: string[], fallback = false): boolean {
  const current = firstPath(value, paths);
  return typeof current === "boolean" ? current : fallback;
}

export function readNumber(value: unknown, paths: string[], fallback = 0): number {
  const current = firstPath(value, paths);
  return typeof current === "number" && Number.isFinite(current) ? current : fallback;
}

export function readString(value: unknown, paths: string[], fallback = ""): string {
  const current = firstPath(value, paths);
  return typeof current === "string" ? current : fallback;
}

export function recordEntries(value: unknown): Array<[string, unknown]> {
  if (!isRecord(value)) return [];
  return Object.entries(value).filter(([, item]) => item !== undefined);
}

export function previewText(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value || "-";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.length}]`;
  if (isRecord(value)) return `{${Object.keys(value).length}}`;
  return String(value);
}
