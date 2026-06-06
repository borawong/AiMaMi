import type { ReactNode } from "react";
import { AccountsStoreUpdater } from "./StoreUpdater";

export function AccountsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <AccountsStoreUpdater />
      {children}
    </>
  );
}
