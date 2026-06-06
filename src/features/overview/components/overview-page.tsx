/**
 * 中文职责说明：overview 页面只装配模块 controller、panels 和 dialogs，不持有 payload 派生或复杂 UI。
 */
import { OverviewDialogsHost } from "../dialogs";
import { useOverviewPageController } from "../hooks";
import { OverviewShell } from "../panels";

export function OverviewPage() {
  const controller = useOverviewPageController();

  return (
    <>
      <OverviewShell controller={controller} />
      <OverviewDialogsHost />
    </>
  );
}
