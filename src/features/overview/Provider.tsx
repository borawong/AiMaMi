import type { ReactNode } from "react";
import { OverviewStoreUpdater } from "./StoreUpdater";

export function OverviewProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <OverviewStoreUpdater />
      {children}
    </>
  );
}
