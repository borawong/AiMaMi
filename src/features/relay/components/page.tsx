import { RelayPageDialogs } from "../dialogs";
import { useRelayPageController } from "../hooks";
import { RelayPagePanels } from "../panels";

/* 中文职责说明：Relay route/module shell 只装配 controller 与 panels/dialogs，不 owning 表单、弹窗或派生列表状态。 */
export function RelayPage() {
  const controller = useRelayPageController();

  return (
    <div className="space-y-5">
      <RelayPagePanels controller={controller} />
      <RelayPageDialogs controller={controller} />
    </div>
  );
}
