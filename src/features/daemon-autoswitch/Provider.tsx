import type { ReactNode } from "react";
import { DaemonAutoswitchStoreUpdater } from "./StoreUpdater";

export function DaemonAutoswitchProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <DaemonAutoswitchStoreUpdater />
      {children}
    </>
  );
}
