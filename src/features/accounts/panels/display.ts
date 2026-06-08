export function formatPlan(plan: string, fallback: string) {
  if (!plan || plan === "unknown") return fallback;
  if (plan === "pro5x") return "5x Pro";
  if (plan === "pro20x") return "20x Pro";
  if (plan === "edu") return "Edu";
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

export function formatAuthMode(value: string) {
  if (value === "apikey") return "API Key";
  if (value === "chatgpt") return "ChatGPT OAuth";
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
