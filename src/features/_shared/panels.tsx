import type { ReactNode } from "react";
import { RefreshCw, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { previewText, recordEntries } from "./data";

export interface EvidenceAction {
  id: string;
  labelKey: string;
  run: () => Promise<unknown>;
  isPending?: boolean;
}

export interface EvidenceQueryState {
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  error?: unknown;
  refetch?: () => Promise<unknown>;
}

export function EvidencePageHeader({
  titleKey,
  descriptionKey,
  actions = [],
}: {
  titleKey: string;
  descriptionKey: string;
  actions?: EvidenceAction[];
}) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-foreground">{t(titleKey)}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
          {t(descriptionKey)}
        </p>
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              type="button"
              size="sm"
              variant="outline"
              disabled={action.isPending}
              onClick={() => void action.run()}
            >
              <Play className="h-3.5 w-3.5" />
              {t(action.labelKey)}
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}

export function EvidenceStatusLine({ state }: { state: EvidenceQueryState }) {
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

export function MetricCard({
  labelKey,
  value,
  hint,
}: {
  labelKey: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <BentoCard compact>
      <span className="text-xs text-muted-foreground">{t(labelKey)}</span>
      <span className="mt-1 block truncate text-lg font-semibold text-foreground">
        {value}
      </span>
      {hint && <span className="mt-1 block truncate text-xs text-muted-foreground">{hint}</span>}
    </BentoCard>
  );
}

export function QueryPanel({
  titleKey,
  state,
  children,
}: {
  titleKey: string;
  state: EvidenceQueryState;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <BentoCard className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground">
            {t(titleKey)}
          </h3>
          <EvidenceStatusLine state={state} />
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
            <RefreshCw className={cn("h-3.5 w-3.5", state.isFetching && "animate-spin")} />
          </Button>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </BentoCard>
  );
}

export function RecordList<TItem = unknown>({
  items,
  emptyKey,
  renderItem,
}: {
  items: TItem[];
  emptyKey: string;
  renderItem?: (item: TItem, index: number) => ReactNode;
}) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <p className="rounded-[8px] border border-dashed border-border p-4 text-sm text-muted-foreground">
        {t(emptyKey)}
      </p>
    );
  }

  return (
    <div className="divide-y divide-border rounded-[8px] border border-border">
      {items.map((item, index) => (
        <div key={index} className="min-w-0 px-4 py-3">
          {renderItem ? renderItem(item, index) : <RecordSummary value={item} />}
        </div>
      ))}
    </div>
  );
}

export function RecordSummary({ value }: { value: unknown }) {
  const entries = recordEntries(value).slice(0, 4);

  if (entries.length === 0) {
    return <p className="truncate text-sm text-muted-foreground">{previewText(value)}</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, item]) => (
        <div key={key} className="grid gap-2 text-xs sm:grid-cols-[9rem_minmax(0,1fr)]">
          <span className="text-muted-foreground">{key}</span>
          <span className="min-w-0 truncate text-foreground">{previewText(item)}</span>
        </div>
      ))}
    </div>
  );
}

export function BoolBadge({
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
