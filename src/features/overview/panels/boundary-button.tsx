import { Bell, KeyRound, Merge, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { OverviewBoundaryAction } from "../types";

export function BoundaryButton({ action }: { action: OverviewBoundaryAction }) {
  const { t } = useTranslation();
  const label = t(action.labelKey);

  return (
    <Button type="button" size="sm" variant="outline" disabled aria-label={label}>
      <BoundaryIcon icon={action.icon} />
      {label}
    </Button>
  );
}

function BoundaryIcon({ icon }: { icon: OverviewBoundaryAction["icon"] }) {
  if (icon === "key") return <KeyRound className="h-3.5 w-3.5" />;
  if (icon === "bell") return <Bell className="h-3.5 w-3.5" />;
  if (icon === "merge") return <Merge className="h-3.5 w-3.5" />;
  return <UserRound className="h-3.5 w-3.5" />;
}
