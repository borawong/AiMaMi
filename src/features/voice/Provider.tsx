/**
 * 中文职责说明：voice 模块 Provider 只装配模块内状态同步器和子内容。
 */
import type { ReactNode } from "react";
import { VoiceStoreUpdater } from "./StoreUpdater";

export function VoiceProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <VoiceStoreUpdater />
      {children}
    </>
  );
}
