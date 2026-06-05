/**
 * 中文职责说明：custom-instructions 模块 Provider 只装配模块内状态同步器和子内容。
 */
import type { ReactNode } from "react";
import { CustomInstructionsStoreUpdater } from "./StoreUpdater";

export function CustomInstructionsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <CustomInstructionsStoreUpdater />
      {children}
    </>
  );
}
