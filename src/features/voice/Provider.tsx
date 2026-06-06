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
