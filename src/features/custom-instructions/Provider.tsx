import type { ReactNode } from "react";
import { CustomInstructionsStoreUpdater } from "./StoreUpdater";

export function CustomInstructionsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <CustomInstructionsStoreUpdater />
      {children}
    </>
  );
}
