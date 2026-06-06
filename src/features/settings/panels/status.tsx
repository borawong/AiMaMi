/**
 * 中文职责说明：settings status 面板只呈现加载/错误状态，不 owning 查询或重试策略。
 */
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2 } from "lucide-react";
import type { SettingsPageController } from "../hooks";

export function SettingsStatusPanel({
  controller,
}: {
  controller: SettingsPageController;
}) {
  const { t } = useTranslation();
  const { statusQuery } = controller.status;

  if (statusQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-[8px] border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("common.loading")}
      </div>
    );
  }

  if (statusQuery.isError) {
    return (
      <div className="flex items-center gap-2 rounded-[8px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        {t("common.error")}
      </div>
    );
  }

  return null;
}
