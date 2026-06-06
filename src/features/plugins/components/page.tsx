import { PluginConfigDialog } from "../dialogs";
import { usePluginsPageController } from "../hooks";
import { PluginsPagePanel } from "../panels";

export function PluginsPage() {
  const controller = usePluginsPageController();

  return (
    <div className="space-y-5">
      <PluginsPagePanel controller={controller} />
      <PluginConfigDialog controller={controller.configDialog} />
    </div>
  );
}
