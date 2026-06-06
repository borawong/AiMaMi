import type { AccountQuotaWindowSlot, AccountRecord } from "../types";

export type AccountsUnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is AccountsUnknownRecord {
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
  return typeof current === "number" && Number.isFinite(current) ? current : fallback;
}

export function readString(value: unknown, paths: string[], fallback = ""): string {
  const current = firstPath(value, paths);
  return typeof current === "string" ? current : fallback;
}

export function readBoolean(value: unknown, paths: string[], fallback = false): boolean {
  const current = firstPath(value, paths);
  return typeof current === "boolean" ? current : fallback;
}

export function accountKey(account: unknown | null | undefined) {
  if (!account) return "";
  return readString(account, ["accountKey", "key", "id"], "");
}

export function accountEmail(account: unknown) {
  return readString(account, ["email", "accountName", "alias", "accountKey"], "");
}

export function accountPlan(account: AccountRecord) {
  return readString(account, ["plan"], "unknown");
}

export function isActiveAccount(account: AccountRecord) {
  return readBoolean(account, ["isActive", "active"], false);
}

export function quotaPercent(
  account: AccountRecord,
  slot: AccountQuotaWindowSlot,
) {
  const value = readNumber(readPath(account, slot), ["remainingPercent"], Number.NaN);
  return Number.isFinite(value) ? value : null;
}

export function tokenStatusCode(account: AccountRecord) {
  return readString(readPath(account, "tokenStatus"), ["code"], "");
}
