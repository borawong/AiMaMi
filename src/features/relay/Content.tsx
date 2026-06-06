import { RelayPage } from "./components/relay-page";
import { DumpedContractBoundary } from "@/features/_shared/dumped-contract-boundary";
import { DUMPED_RELAY_COMMANDS } from "./dumped-contract";

export function RelayContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="relay" commands={DUMPED_RELAY_COMMANDS} />
      <RelayPage />
    </>
  );
}
