import type { ReactNode } from "react";
import { McpStoreUpdater } from "./StoreUpdater";

export function McpProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <McpStoreUpdater />
      {children}
    </>
  );
}
