import type { ReactNode } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  OverviewDataPanelModel,
  OverviewInfoRow,
  OverviewQueryState,
  OverviewRecordPayload,
  OverviewSkillRecord,
} from "../types";
import { BoundaryButton } from "./boundary";
import { SafePayloadSummary } from "./payload";
import { OverviewRecordList } from "./records";

export function OverviewDataPanels({ panels }: { panels: OverviewDataPanelModel[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {panels.map((panel) => (
        <OverviewDataPanelFrame key={panel.id} titleKey={panel.titleKey} state={panel.state}>
          <OverviewDataPanelBody panel={panel} />
        </OverviewDataPanelFrame>
      ))}
    </div>
  );
}

function OverviewDataPanelFrame({
  titleKey,
  state,
  children,
}: {
  titleKey: string;
  state: OverviewQueryState;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const statusKey = state.isLoading
    ? "common.loading"
    : state.isError
      ? "common.error"
      : state.isFetching
        ? "common.refreshing"
        : "";

  return (
    <BentoCard className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground">{t(titleKey)}</h3>
          {statusKey ? (
            <span
              className={cn(
                "text-xs text-muted-foreground",
                state.isError && "text-destructive",
              )}
            >
              {t(statusKey)}
            </span>
          ) : null}
        </div>
        {state.refetch ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={state.isFetching}
            aria-label={t("common.refresh")}
            onClick={() => void state.refetch?.()}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", state.isFetching && "animate-spin")} />
          </Button>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </BentoCard>
  );
}

function OverviewDataPanelBody({ panel }: { panel: OverviewDataPanelModel }) {
  if (panel.kind === "rows") {
    return <OverviewInfoRows rows={panel.rows} />;
  }

  if (panel.kind === "records") {
    return (
      <OverviewRecordList<OverviewRecordPayload>
        items={panel.items}
        emptyKey={panel.emptyKey}
      />
    );
  }

  if (panel.kind === "skills") {
    return (
      <OverviewRecordList
        items={panel.items}
        emptyKey={panel.emptyKey}
        renderItem={(skill) => <OverviewSkillRecordItem skill={skill} />}
      />
    );
  }

  if (panel.kind === "mystery") {
    return (
      <>
        <SafePayloadSummary value={panel.payload} />
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {/* 远端密钥和授权合并需要完整安全流程证据，当前只保留禁用边界入口。 */}
          {panel.boundaryActions.map((action) => (
            <BoundaryButton key={action.id} action={action} />
          ))}
        </div>
      </>
    );
  }

  return <SafePayloadSummary value={panel.payload} />;
}

function OverviewInfoRows({ rows }: { rows: OverviewInfoRow[] }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 text-sm">
      {rows.map((row) => (
        <div key={row.id} className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <span className="text-muted-foreground">{t(row.labelKey)}</span>
          <span className="min-w-0 truncate text-foreground">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function OverviewSkillRecordItem({ skill }: { skill: OverviewSkillRecord }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {skill.title || t("skills.empty")}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {skill.updatedAtLabel}
        </p>
      </div>
      <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );
}
