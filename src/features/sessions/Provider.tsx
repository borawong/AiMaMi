import type { ReactNode } from "react";
import { SessionsStoreUpdater } from "./StoreUpdater";

export function SessionsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <SessionsStoreUpdater />
      {children}
    </>
  );
}
