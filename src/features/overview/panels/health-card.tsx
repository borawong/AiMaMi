import { FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OverviewHealthModel } from "../types";
import { StatusPill } from "./status-pill";

export function HealthCard({ health }: { health: OverviewHealthModel }) {
  const { t } = useTranslation();

  return (
    <BentoCard className="min-h-[260px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[13px] font-bold">{t("overview.healthTitle")}</span>
        <StatusPill ok={health.healthy} loading={health.loading}>
          {t(health.healthy ? "overview.healthOk" : "overview.healthMissing")}
        </StatusPill>
      </div>
      <ul className="m-0 list-none p-0">
        {health.items.map((item, index) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center justify-between py-2.5 text-[13px] text-muted-foreground",
              index < health.items.length - 1 && "border-b border-border",
            )}
          >
            <span>{t(item.labelKey)}</span>
            <StatusPill ok={item.ok} loading={health.loading}>
              {t(item.ok ? "overview.healthOk" : "overview.healthMissing")}
            </StatusPill>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-auto shrink-0 self-start"
        disabled
      >
        <FolderOpen className="h-3.5 w-3.5" />
        {t("overview.openCodexFolder")}
      </Button>
    </BentoCard>
  );
}
