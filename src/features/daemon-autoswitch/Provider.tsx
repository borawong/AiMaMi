/**
 * 中文职责说明：daemon-autoswitch 模块 Provider 只装配模块内状态同步器和子内容。
 */
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
