/**
 * 中文职责说明：daemon-autoswitch 页面只展示后台自动切换的只读运行状态，
 * 不承载无 raw live route 证据的配置流程或业务状态机。
 */
import type { ReactNode } from "react";
import { Activity, Clock, RefreshCw, ToggleLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";
import { useDaemonAutoswitchModule } from "../hooks";
import {
  envelopeData,
  previewText,
  readBoolean,
  readNumber,
  readRecordField,
  readString,
  recordEntries,
} from "../utils";

interface DaemonQueryState {
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  refetch?: () => unknown;
}

export function DaemonAutoswitchPage() {
  const module = useDaemonAutoswitchModule();
  const bootstrap = envelopeData(module.bootstrapQuery.data);
  const pending = envelopeData(module.pendingQuery.data);
  const autoSwitch = envelopeData(readRecordField(bootstrap, "autoSwitch"));
  const enabled = readBoolean(autoSwitch, ["enabled"]);
  const serviceState = readString(autoSwitch, ["serviceState"], "");
  const writtenAt = readNumber(bootstrap, ["writtenAt"]);

  return (
    <div className="space-y-5">
      <DaemonAutoswitchPageHeader />

      <div className="grid gap-3 md:grid-cols-3">
        <DaemonMetricCard
          labelKey="daemonAutoswitch.enabled"
          value={
            <DaemonBoolBadge
              value={enabled}
              trueKey="overview.enabled"
              falseKey="overview.disabled"
            />
          }
        />
        <DaemonMetricCard
          labelKey="daemonAutoswitch.serviceState"
          value={
            <span className="inline-flex min-w-0 items-center gap-2">
              <Activity className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{serviceState || "-"}</span>
            </span>
          }
        />
        <DaemonMetricCard
          labelKey="daemonAutoswitch.writtenAt"
          value={
            <span className="inline-flex min-w-0 items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{writtenAt ? formatDateTime(writtenAt) : "-"}</span>
            </span>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DaemonQueryPanel
          titleKey="daemonAutoswitch.bootstrap"
          state={module.bootstrapQuery}
        >
          <div className="flex min-w-0 items-start gap-2 rounded-[8px] border border-border p-3 text-sm text-muted-foreground">
            <ToggleLeft className="mt-0.5 h-4 w-4 shrink-0" />
            <DaemonRecordSummary value={autoSwitch} />
          </div>
        </DaemonQueryPanel>
        <DaemonQueryPanel
          titleKey="daemonAutoswitch.pending"
          state={module.pendingQuery}
        >
          <DaemonRecordSummary value={pending} />
        </DaemonQueryPanel>
      </div>
    </div>
  );
}

function DaemonAutoswitchPageHeader() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-foreground">
          {t("nav.daemonAutoswitch")}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("daemonAutoswitch.description")}
        </p>
      </div>
    </section>
  );
}

function DaemonMetricCard({
  labelKey,
  value,
}: {
  labelKey: string;
  value: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <BentoCard compact className="rounded-[8px]">
      <span className="text-xs text-muted-foreground">{t(labelKey)}</span>
      <span className="mt-1 block min-w-0 truncate text-lg font-semibold text-foreground">
        {value}
      </span>
    </BentoCard>
  );
}

function DaemonQueryPanel({
  titleKey,
  state,
  children,
}: {
  titleKey: string;
  state: DaemonQueryState;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <BentoCard className="min-w-0 rounded-[8px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground">
            {t(titleKey)}
          </h3>
          <DaemonStatusLine state={state} />
        </div>
        {state.refetch && (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={state.isFetching}
            aria-label={t("common.refresh")}
            onClick={() => void state.refetch?.()}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", state.isFetching && "animate-spin")}
            />
          </Button>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </BentoCard>
  );
}

function DaemonStatusLine({ state }: { state: DaemonQueryState }) {
  const { t } = useTranslation();
  const key = state.isLoading
    ? "feature.restored.loading"
    : state.isError
      ? "feature.restored.error"
      : state.isFetching
        ? "feature.restored.refreshing"
        : "feature.restored.ready";

  return (
    <span
      className={cn(
        "text-xs text-muted-foreground",
        state.isError && "text-destructive",
      )}
    >
      {t(key)}
    </span>
  );
}

function DaemonRecordSummary({ value }: { value: unknown }) {
  const entries = recordEntries(value).slice(0, 4);

  if (entries.length === 0) {
    return <p className="min-w-0 truncate text-sm">{previewText(value)}</p>;
  }

  return (
    <div className="min-w-0 flex-1 space-y-2">
      {entries.map(([key, item]) => (
        <div key={key} className="grid gap-2 text-xs sm:grid-cols-[9rem_minmax(0,1fr)]">
          <span className="text-muted-foreground">{key}</span>
          <span className="min-w-0 truncate text-foreground">{previewText(item)}</span>
        </div>
      ))}
    </div>
  );
}

function DaemonBoolBadge({
  value,
  trueKey,
  falseKey,
}: {
  value: boolean;
  trueKey: string;
  falseKey: string;
}) {
  const { t } = useTranslation();

  return (
    <Badge variant={value ? "default" : "outline"} className="shrink-0">
      {t(value ? trueKey : falseKey)}
    </Badge>
  );
}
