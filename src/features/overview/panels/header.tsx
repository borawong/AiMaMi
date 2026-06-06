import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OverviewAction } from "../types";

export function OverviewPageHeader({
  titleKey,
  descriptionKey,
  actions,
}: {
  titleKey: string;
  descriptionKey: string;
  actions: OverviewAction[];
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
            <RefreshCw className={cn("h-3.5 w-3.5", action.isPending && "animate-spin")} />
            {t(action.labelKey)}
          </Button>
        ))}
      </div>
    </section>
  );
}
