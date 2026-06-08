import { MonitorUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { TrayShellHeaderProps } from "../types";

export function TrayShellHeader({ focusAction }: TrayShellHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0" />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={focusAction.isPending}
        onClick={() => void focusAction.run()}
      >
        <MonitorUp className="h-3.5 w-3.5" />
        {t(focusAction.displayKey)}
      </Button>
    </header>
  );
}
