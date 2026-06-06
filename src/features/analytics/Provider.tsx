/**
 * 中文职责说明：analytics 模块 Provider 只装配模块内状态同步器和子内容。
 */
import type { ReactNode } from "react";
import { AnalyticsStoreUpdater } from "./StoreUpdater";

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <AnalyticsStoreUpdater />
      {children}
    </>
  );
}
