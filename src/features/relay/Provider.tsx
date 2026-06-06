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
