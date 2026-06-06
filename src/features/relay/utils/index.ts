/**
 * 中文职责说明：Relay 模块只在本模块内读取 dumped payload，避免把未知证据结构渲染成跨模块通用占位。
 */
export type RelayUnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is RelayUnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function envelopeData<T = unknown>(value: unknown): T | null {
  if (!isRecord(value)) return (value ?? null) as T | null;
  if ("data" in value) return (value.data ?? null) as T | null;
  return value as T;
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

export function readArray<T = unknown>(value: unknown, paths: string[]): T[] {
  const current = firstPath(value, paths);
  return Array.isArray(current) ? (current as T[]) : [];
}

export function readNumber(value: unknown, paths: string[], fallback = 0): number {
  const current = firstPath(value, paths);
  return typeof current === "number" && Number.isFinite(current)
    ? current
    : fallback;
}

export function readString(value: unknown, paths: string[], fallback = ""): string {
  const current = firstPath(value, paths);
  return typeof current === "string" ? current : fallback;
}

export function readBoolean(
  value: unknown,
  paths: string[],
  fallback = false,
): boolean {
  const current = firstPath(value, paths);
  return typeof current === "boolean" ? current : fallback;
}
