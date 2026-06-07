import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2 } from "lucide-react";
import type { SettingsControllerProps } from "../types";

export function SettingsStatusPanel({
  controller,
}: SettingsControllerProps) {
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
