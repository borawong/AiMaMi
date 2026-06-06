import { useTranslation } from "react-i18next";
import type {
  TrayShellRuntimePanelModel,
  TrayShellRuntimeRowModel,
} from "../types";

export function TrayShellRuntimePanel({
  panel,
}: {
  panel: TrayShellRuntimePanelModel;
}) {
  const { t } = useTranslation();

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <h2 className="truncate text-sm font-semibold text-foreground">
          {t(panel.titleKey)}
        </h2>
        {panel.refreshing ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {t("common.refreshing")}
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {panel.rows.map((row) => (
          <TrayShellRuntimeRow key={row.id} row={row} />
        ))}
      </div>
    </section>
  );
}

function TrayShellRuntimeRow({ row }: { row: TrayShellRuntimeRowModel }) {
  const { t } = useTranslation();
  const value = row.valueKey ? t(row.valueKey) : row.value;

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-[8px] border border-border/60 bg-muted/30 px-3 py-2.5">
      <span className="shrink-0 text-xs text-muted-foreground">
        {t(row.labelKey)}
      </span>
      <span className="min-w-0 truncate text-sm font-medium text-foreground">
        {value || "-"}
      </span>
    </div>
  );
}
