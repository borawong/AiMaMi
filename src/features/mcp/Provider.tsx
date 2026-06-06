/**
 * 中文职责说明：mcp 模块 Provider 只装配模块内状态同步器和子内容。
 */
import type { ReactNode } from "react";
import { McpStoreUpdater } from "./StoreUpdater";

export function McpProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <McpStoreUpdater />
      {children}
    </>
  );
}
