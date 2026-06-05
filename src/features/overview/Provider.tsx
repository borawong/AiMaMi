/**
 * 中文职责说明：overview 模块 Provider 只装配模块内状态同步器和子内容。
 */
import type { ReactNode } from "react";
import { OverviewStoreUpdater } from "./StoreUpdater";

export function OverviewProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <OverviewStoreUpdater />
      {children}
    </>
  );
}
