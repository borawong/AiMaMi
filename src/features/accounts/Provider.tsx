/**
 * 中文职责说明：accounts 模块 Provider 只装配模块内状态同步器和子内容。
 */
import type { ReactNode } from "react";
import { AccountsStoreUpdater } from "./StoreUpdater";

export function AccountsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <AccountsStoreUpdater />
      {children}
    </>
  );
}
