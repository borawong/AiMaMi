import type { ReactNode } from "react";
import { MaintenanceStoreUpdater } from "./StoreUpdater";

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <MaintenanceStoreUpdater />
      {children}
    </>
  );
}
