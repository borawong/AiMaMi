import type { ReactNode } from "react";
import { SettingsStoreUpdater } from "./StoreUpdater";

export function SettingsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <SettingsStoreUpdater />
      {children}
    </>
  );
}
