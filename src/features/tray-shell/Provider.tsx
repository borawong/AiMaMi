import type { ReactNode } from "react";
import { TrayShellStoreUpdater } from "./StoreUpdater";

export function TrayShellProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <TrayShellStoreUpdater />
      {children}
    </>
  );
}
