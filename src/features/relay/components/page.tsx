import { RelayPageDialogs } from "../dialogs";
import { useRelayPageController } from "../hooks";
import { RelayPagePanels } from "../panels";

export function RelayPage() {
  const controller = useRelayPageController();

  return (
    <div className="space-y-5">
      <RelayPagePanels controller={controller} />
      <RelayPageDialogs controller={controller} />
    </div>
  );
}
