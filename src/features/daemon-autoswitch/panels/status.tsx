/**
 * 中文职责说明：daemon-autoswitch status 只把 query 状态映射为 locale key。
 */
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { DaemonAutoswitchQueryState } from "../types";

export function DaemonStatusLine({ state }: { state: DaemonAutoswitchQueryState }) {
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
