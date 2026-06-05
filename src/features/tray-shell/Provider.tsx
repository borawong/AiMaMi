/**
 * 中文职责说明：tray-shell 模块 Provider 只装配模块内状态同步器和子内容。
 */
import type { ReactNode } from "react";
import { TrayShellStoreUpdater } from "./StoreUpdater";

export function TrayShellProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <TrayShellStoreUpdater />
      {children}
    </>
  );
}
