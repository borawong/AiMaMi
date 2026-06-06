import { useAnalyticsPageController } from "../hooks";
import { AnalyticsDialogs } from "../dialogs";
import { AnalyticsPageHeader, AnalyticsPanels } from "../panels";

export function AnalyticsPage() {
  const controller = useAnalyticsPageController();

  return (
    <div className="space-y-5">
      <AnalyticsPageHeader />
      <AnalyticsPanels controller={controller} />
      <AnalyticsDialogs />
    </div>
  );
}
