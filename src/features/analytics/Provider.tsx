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
