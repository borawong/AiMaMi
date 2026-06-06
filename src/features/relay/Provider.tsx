/**
 * 中文职责说明：relay 模块 Provider 只装配模块内状态同步器和子内容。
 */
import type { ReactNode } from "react";
import { RelayStoreUpdater } from "./StoreUpdater";

export function RelayProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <RelayStoreUpdater />
      {children}
    </>
  );
}
