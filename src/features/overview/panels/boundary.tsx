import { Bell, KeyRound, Loader2, Merge, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { OverviewBoundaryAction } from "../types";

export function BoundaryButton({ action }: { action: OverviewBoundaryAction }) {
  const { t } = useTranslation();
  const label = t(action.labelKey);

  const button = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={action.disabled || action.isPending}
      aria-label={label}
      onClick={() => void action.run?.()}
    >
      {action.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <BoundaryIcon icon={action.icon} />
      )}
      {label}
    </Button>
  );

  if (!action.descriptionKey) return button;

  return (
    <div className="flex flex-col gap-1">
      {button}
      <span className="max-w-[12rem] text-xs leading-5 text-muted-foreground">
        {t(action.descriptionKey)}
      </span>
    </div>
  );
}

function BoundaryIcon({ icon }: { icon: OverviewBoundaryAction["icon"] }) {
  if (icon === "key") return <KeyRound className="h-3.5 w-3.5" />;
  if (icon === "bell") return <Bell className="h-3.5 w-3.5" />;
  if (icon === "merge") return <Merge className="h-3.5 w-3.5" />;
  return <UserRound className="h-3.5 w-3.5" />;
}
