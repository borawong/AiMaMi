import type { TrayShellViewProps } from "../types";
import { TrayShellHeader } from "./header";
import { TrayShellMetrics } from "./metrics";

export function TrayShellView({ controller }: TrayShellViewProps) {
  return (
    <div className="space-y-5">
      <TrayShellHeader focusAction={controller.focusAction} />
      <TrayShellMetrics metrics={controller.metrics} />
    </div>
  );
}
