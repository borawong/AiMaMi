/**
 * 中文职责说明：Relay 模块只在本模块内读取 dumped payload，避免把未知证据结构渲染成跨模块通用占位。
 */
import type { RelayNetworkMode, WireApi } from "../types";

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

// 中文职责说明：Relay UI 工具只做字段归一化和展示输入校验，不触碰 IPC/service/cache 合同。
export function normalizeWireApi(value: string): WireApi {
  if (value === "openai-responses" || value === "anthropic") return value;
  return "openai-chat";
}

export function normalizeNetwork(value: string): RelayNetworkMode {
  return value === "direct" ? "direct" : "system";
}

export function inferWireApi(model: string): WireApi | null {
  const normalized = model.trim().toLowerCase();
  if (normalized.startsWith("gpt")) return "openai-responses";
  if (normalized.startsWith("claude")) return "anthropic";
  return null;
}

export function validateExtraHeaders(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!isRecord(parsed)) return "invalid";
    if (Object.values(parsed).some((item) => typeof item !== "string")) {
      return "invalid";
    }
    return null;
  } catch {
    return "invalid";
  }
}
