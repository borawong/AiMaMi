/**
 * 中文职责说明：plugins 页面是 route/module shell，只装配 controller、panel 和 dialog。
 */
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
