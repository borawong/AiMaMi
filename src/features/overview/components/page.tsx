import { useOverviewPageController } from "../hooks";
import { OverviewShell } from "../panels";

export function OverviewPage() {
  const controller = useOverviewPageController();

  return (
    <OverviewShell controller={controller} />
  );
}
