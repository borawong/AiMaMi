import { useIsFetching } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Route } from "@/types/navigation";

export function RouteHighIoFeedback({ route }: { route: Route }) {
  const { t } = useTranslation();
  const fetchingCount = useIsFetching({ queryKey: [route] });

  if (fetchingCount === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute right-5 top-4 z-10 rounded-full border border-border bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
      {t("routes.highIoFeedback")}
    </div>
  );
}
