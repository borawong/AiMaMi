import type { ReactNode } from "react";
import { SkillsStoreUpdater } from "./StoreUpdater";

export function SkillsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <SkillsStoreUpdater />
      {children}
    </>
  );
}
