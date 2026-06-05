/**
 * 中文职责说明：maintenance 模块 Provider 只装配模块内状态同步器和子内容。
 */
import type { ReactNode } from "react";
import { MaintenanceStoreUpdater } from "./StoreUpdater";

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <MaintenanceStoreUpdater />
      {children}
    </>
  );
}
