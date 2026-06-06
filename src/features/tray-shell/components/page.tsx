import { useTrayShellPageController } from "../hooks";
import { TrayShellView } from "../panels";

export function TrayShellPage() {
  const controller = useTrayShellPageController();

  return <TrayShellView controller={controller} />;
}
