/**
 * 中文职责说明：sessions 主面板拥有指标、加载/空态和树形视图装配；page shell 只挂载控制器与弹窗。
 */
import {
  MessageSquareText,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SessionMetricItem, SessionsPageController } from "../types";
import { SessionsTreePanel } from "./tree";

export function SessionsMainPanel({
  controller,
}: {
  controller: SessionsPageController;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-hidden">
      <SessionsPanelHeader
        titleKey="nav.sessions"
        descriptionKey="sessions.description"
      />

      <div className="flex shrink-0 items-center justify-between gap-4">
        <SessionsMetricsPanel metrics={controller.metrics} />
        <div className="flex shrink-0 items-center gap-2">
          {controller.selectedCount > 0 ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={controller.deletePending}
              onClick={controller.requestSelectedDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("sessions.delete")} ({controller.selectedCount})
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={controller.refreshPending}
            aria-label={t("common.refresh")}
            onClick={() => void controller.refresh()}
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                controller.refreshPending && "animate-spin",
              )}
            />
          </Button>
        </div>
      </div>

      {controller.orphanCount > 0 ? (
        <div className="shrink-0">
          <Badge
            variant="outline"
            className="border-amber-500/20 bg-amber-500/[0.06] text-amber-700 dark:text-amber-300"
          >
            {t("sessions.orphanCount", { count: controller.orphanCount })}
          </Badge>
        </div>
      ) : null}

      <SessionsStatePanel controller={controller} />
    </div>
  );
}

function SessionsPanelHeader({
  titleKey,
  descriptionKey,
}: {
  titleKey: string;
  descriptionKey: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="shrink-0">
      <h1 className="truncate text-xl font-semibold text-foreground">
        {t(titleKey)}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        {t(descriptionKey)}
      </p>
    </div>
  );
}

function SessionsMetricsPanel({
  metrics,
}: {
  metrics: SessionMetricItem[];
}) {
  return (
    <div className="grid flex-1 gap-3 md:grid-cols-4">
      {metrics.map((metric) => (
        <SessionMetricCard key={metric.key} metric={metric} />
      ))}
    </div>
  );
}

function SessionMetricCard({
  metric,
}: {
  metric: SessionMetricItem;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="text-xs font-medium text-muted-foreground">
        {t(metric.labelKey)}
      </div>
      <div className="mt-2 text-lg font-semibold text-foreground">
        {metric.value}
      </div>
    </div>
  );
}

function SessionsStatePanel({
  controller,
}: {
  controller: SessionsPageController;
}) {
  const { t } = useTranslation();

  if (controller.loading) {
    return <SessionsLoading />;
  }

  if (controller.groups.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-border bg-card">
        <div className="text-center">
          <MessageSquareText className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("sessions.empty")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <SessionsTreePanel
      groups={controller.groups}
      expandedProjects={controller.expandedProjects}
      expandedThreads={controller.expandedThreads}
      selected={controller.selected}
      focusedId={controller.focusedId}
      onToggleProject={controller.toggleProject}
      onToggleThread={controller.toggleThread}
      onToggleIds={controller.toggleIds}
      onFocusSession={controller.focusSession}
    />
  );
}

function SessionsLoading() {
  return (
    <div className="min-h-0 flex-1 rounded-2xl border border-border bg-card p-4">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
          >
            <Skeleton className="h-4 w-4 rounded-[4px]" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
