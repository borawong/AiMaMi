/**
 * 中文职责说明：skills 模块 Provider 只装配模块内状态同步器和子内容。
 */
import type { ReactNode } from "react";
import { SkillsStoreUpdater } from "./StoreUpdater";

export function SkillsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <SkillsStoreUpdater />
      {children}
    </>
  );
}
