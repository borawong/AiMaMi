import { usePluginsPageController } from "../hooks";
import { PluginsPagePanel } from "../panels";

export function PluginsPage() {
  const controller = usePluginsPageController();

  return <PluginsPagePanel controller={controller} />;
}
