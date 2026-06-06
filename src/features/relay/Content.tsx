import { RelayPage } from "./components/page";
import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { DUMPED_RELAY_COMMANDS } from "./contract";

export function RelayContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="relay" commands={DUMPED_RELAY_COMMANDS} />
      <RelayPage />
    </>
  );
}
