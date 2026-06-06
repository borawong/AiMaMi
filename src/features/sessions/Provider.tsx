/**
 * 中文职责说明：sessions 模块 Provider 只装配模块内状态同步器和子内容。
 */
import type { ReactNode } from "react";
import { SessionsStoreUpdater } from "./StoreUpdater";

export function SessionsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <SessionsStoreUpdater />
      {children}
    </>
  );
}
