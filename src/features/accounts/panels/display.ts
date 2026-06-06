const PLAN_LABEL_KEYS: Record<string, string> = {
  free: "accounts.planLabels.free",
  plus: "accounts.planLabels.plus",
  pro5x: "accounts.planLabels.pro5x",
  pro20x: "accounts.planLabels.pro20x",
  team: "accounts.planLabels.team",
  business: "accounts.planLabels.business",
  enterprise: "accounts.planLabels.enterprise",
  edu: "accounts.planLabels.edu",
};

const AUTH_MODE_LABEL_KEYS: Record<string, string> = {
  chatgpt: "accounts.authModes.chatgpt",
  apikey: "accounts.authModes.apikey",
};

export function formatPlan(plan: string, t: (key: string) => string) {
  if (!plan || plan === "unknown") return t("accounts.planUnknown");
  const labelKey = PLAN_LABEL_KEYS[plan];
  if (labelKey) return t(labelKey);
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function formatPercent(value: number | null) {
  return value == null ? "-" : `${Math.round(value)}%`;
}

export function quotaTextClass(value: number | null, selected: boolean) {
  if (value == null) {
    return selected ? "text-primary-foreground/70" : "text-muted-foreground";
  }
  if (selected) {
    return value > 50
      ? "text-emerald-200"
      : value > 20
        ? "text-amber-200"
        : "text-red-200";
  }
  return value > 50
    ? "text-emerald-500"
    : value > 20
      ? "text-amber-500"
      : "text-destructive";
}

export function quotaBarClass(value: number | null) {
  if (value == null) return "bg-muted-foreground/20";
  return value > 50
    ? "bg-emerald-500"
    : value > 20
      ? "bg-amber-500"
      : "bg-destructive";
}

export function quotaDotClass(value: number | null) {
  if (value == null) return "bg-muted-foreground/40";
  return value > 50
    ? "bg-emerald-500"
    : value > 20
      ? "bg-amber-500"
      : "bg-destructive";
}

export function formatEpoch(value: number) {
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

export function formatAuthMode(value: string, t: (key: string) => string) {
  const labelKey = AUTH_MODE_LABEL_KEYS[value];
  if (labelKey) return t(labelKey);
  return value;
}

export function formatSubscription(value: unknown, t: (key: string) => string) {
  if (value === true) return t("accounts.subscriptionActive");
  if (value === false) return t("accounts.subscriptionInactive");
  return t("accounts.notAvailable");
}

export function formatAutoRenew(value: unknown, t: (key: string) => string) {
  if (value === true) return t("accounts.autoRenewEnabled");
  if (value === false) return t("accounts.autoRenewDisabled");
  return t("accounts.notAvailable");
}
