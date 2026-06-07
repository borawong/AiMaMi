import type {
  OverviewActiveAccountModel,
  OverviewHealthModel,
  OverviewQuotaWindow,
  OverviewSkillRecord,
} from "../types";
import type { InstalledSkillSummary } from "@/types";

export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
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

export function recordEntries(value: unknown): [string, unknown][] {
  if (!isRecord(value)) return [];
  return Object.entries(value).filter(([, item]) => item !== undefined);
}

export function previewText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function readOverviewHealth(
  snapshot: unknown,
  loading: boolean,
): OverviewHealthModel {
  const codexHome = readString(snapshot, ["status.paths.codexHome", "paths.codexHome"]);
  const authExists = readBoolean(snapshot, [
    "status.paths.authExists",
    "paths.authExists",
  ]);
  const registryExists = readBoolean(snapshot, [
    "status.paths.registryExists",
    "paths.registryExists",
  ]);
  const items = [
    {
      id: "codex-home" as const,
      labelKey: "overview.healthCodexHome",
      ok: Boolean(codexHome),
    },
    {
      id: "auth" as const,
      labelKey: "overview.healthAuth",
      ok: authExists,
    },
    {
      id: "registry" as const,
      labelKey: "overview.healthRegistry",
      ok: registryExists,
    },
  ];

  return {
    codexHome,
    authExists,
    registryExists,
    healthy: items.every((item) => item.ok),
    loading,
    items,
  };
}

export function readOverviewActiveAccount(
  snapshot: unknown,
  loading: boolean,
): OverviewActiveAccountModel {
  const account = findOverviewActiveAccount(snapshot);
  const hasAccount = isRecord(account);

  return {
    hasAccount,
    accountLabel: hasAccount ? readOverviewAccountEmail(account) : "",
    accountKeyLabel: hasAccount ? readOverviewAccountKey(account) : "",
    plan: hasAccount ? readOverviewAccountPlan(account) : "",
    apiReachable: readBoolean(
      snapshot,
      [
        "apiReachable",
        "status.apiReachable",
        "usageStatus.apiReachable",
        "status.usageStatus.apiReachable",
      ],
      true,
    ),
    loading,
    primaryWindow: hasAccount ? readOverviewQuotaWindow(account, "primary") : null,
    secondaryWindow: hasAccount ? readOverviewQuotaWindow(account, "secondary") : null,
  };
}

export function readOverviewSkillRecords(
  items: InstalledSkillSummary[],
): OverviewSkillRecord[] {
  return items.map((item, index) => ({
    id: item.id || item.name || String(index),
    title: item.title || item.name || item.id,
    updatedAtLabel: formatOverviewOptionalEpoch(item.updatedAt),
  }));
}

export function formatOverviewOptionalEpoch(value: number | null): string {
  return value ? formatOverviewEpoch(value) : "";
}

export function formatOverviewEpoch(value: number): string {
  const millis = value > 10_000_000_000 ? value : value * 1000;
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function findOverviewActiveAccount(snapshot: unknown): unknown | null {
  const direct = firstPath(snapshot, [
    "activeAccount",
    "currentAccount",
    "status.activeAccount",
    "status.currentAccount",
  ]);
  if (isRecord(direct)) return direct;

  const activeKey = readString(snapshot, [
    "activeAccountKey",
    "currentAccountKey",
    "status.activeAccountKey",
    "status.currentAccountKey",
  ]);
  const accounts = readArray(snapshot, [
    "accounts",
    "items",
    "status.accounts",
    "status.accounts.items",
    "registry.accounts",
    "registry.items",
  ]);

  return (
    accounts.find((account) => {
      if (!isRecord(account)) return false;
      return (
        readBoolean(account, ["active", "isActive", "current"]) ||
        (activeKey.length > 0 && readOverviewAccountKey(account) === activeKey)
      );
    }) ?? null
  );
}

function readOverviewAccountKey(account: unknown): string {
  return readString(account, ["accountKey", "key", "id", "email"], "");
}

function readOverviewAccountEmail(account: unknown): string {
  return readString(account, ["email", "profile.email", "account.email"], "");
}

function readOverviewAccountPlan(account: unknown): string {
  return readString(account, ["plan", "subscription.plan", "account.plan"], "");
}

function readOverviewQuotaWindow(
  account: unknown,
  kind: "primary" | "secondary",
): OverviewQuotaWindow | null {
  const prefix = kind === "primary" ? "primaryWindow" : "secondaryWindow";
  const aliases =
    kind === "primary"
      ? [
          "primaryWindow",
          "fiveHourWindow",
          "quota.primaryWindow",
          "quota.fiveHourWindow",
        ]
      : [
          "secondaryWindow",
          "weeklyWindow",
          "quota.secondaryWindow",
          "quota.weeklyWindow",
        ];
  const window = aliases
    .map((path) => firstPath(account, [path]))
    .find((value) => isRecord(value));
  const remainingPercent = readNumber(
    window,
    ["remainingPercent", "remaining", "percent"],
    Number.NaN,
  );
  const resetsAt = readNumber(window, ["resetsAt", "resetAt", "resetAtMs"], Number.NaN);

  if (Number.isFinite(remainingPercent) || Number.isFinite(resetsAt)) {
    return buildQuotaWindow(remainingPercent, resetsAt);
  }

  const flattenedRemaining = readNumber(
    account,
    [
      `${prefix}.remainingPercent`,
      `${prefix}.remaining`,
      kind === "primary" ? "fiveHourRemainingPercent" : "weeklyRemainingPercent",
    ],
    Number.NaN,
  );
  const flattenedReset = readNumber(
    account,
    [
      `${prefix}.resetsAt`,
      `${prefix}.resetAt`,
      kind === "primary" ? "fiveHourResetAt" : "weeklyResetAt",
    ],
    Number.NaN,
  );

  if (!Number.isFinite(flattenedRemaining) && !Number.isFinite(flattenedReset)) {
    return null;
  }

  return buildQuotaWindow(flattenedRemaining, flattenedReset);
}

function buildQuotaWindow(
  remainingPercent: number,
  resetsAt: number,
): OverviewQuotaWindow {
  const safeRemaining = Number.isFinite(remainingPercent) ? remainingPercent : null;
  const safeReset = Number.isFinite(resetsAt) ? resetsAt : null;

  return {
    remainingPercent: safeRemaining,
    resetsAt: safeReset,
    resetLabel: safeReset == null ? "" : formatOverviewEpoch(safeReset),
  };
}
