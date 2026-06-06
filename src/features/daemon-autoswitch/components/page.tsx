import { useDaemonAutoswitchPageController } from "../hooks";
import { DaemonAutoswitchShell } from "../panels";

export function DaemonAutoswitchPage() {
  const controller = useDaemonAutoswitchPageController();

  return <DaemonAutoswitchShell controller={controller} />;
}
