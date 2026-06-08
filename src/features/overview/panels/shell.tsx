import type { OverviewPageController } from "../types";
import { ActiveAccountCard } from "./account";
import { OverviewDataPanels } from "./data";
import { HealthCard } from "./health";
import { OverviewMetricCards } from "./metrics";
import { OverviewPageHeader } from "./header";

export function OverviewShell({
  controller,
}: {
  controller: OverviewPageController;
}) {
  return (
    <div className="space-y-5">
      <OverviewPageHeader
        titleKey="nav.overview"
        actions={controller.actions}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <ActiveAccountCard
          account={controller.activeAccount}
          boundaryAction={controller.accountBoundaryAction}
        />
        <HealthCard health={controller.health} />
      </div>

      <OverviewMetricCards metrics={controller.metrics} />
      <OverviewDataPanels panels={controller.dataPanels} />
    </div>
  );
}
