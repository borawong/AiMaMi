/**
 * 中文职责说明：plugins 模块 Provider 只装配模块内状态同步器和子内容。
 */
import type { ReactNode } from "react";
import { PluginsStoreUpdater } from "./StoreUpdater";

export function PluginsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <PluginsStoreUpdater />
      {children}
    </>
  );
}
