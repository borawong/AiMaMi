import { MonitorUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { TrayShellHeaderProps } from "../types";

export function TrayShellHeader({ focusAction }: TrayShellHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-foreground">
          {t("nav.trayShell")}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("trayShell.description")}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={focusAction.isPending}
        onClick={() => void focusAction.run()}
      >
        <MonitorUp className="h-3.5 w-3.5" />
        {t(focusAction.labelKey)}
      </Button>
    </header>
  );
}
