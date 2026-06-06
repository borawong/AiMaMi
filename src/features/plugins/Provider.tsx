import type { ReactNode } from "react";
import { PluginsStoreUpdater } from "./StoreUpdater";

export function PluginsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <PluginsStoreUpdater />
      {children}
    </>
  );
}
