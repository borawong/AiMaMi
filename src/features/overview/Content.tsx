import { OverviewPage } from "./components/overview-page";
import { DumpedContractBoundary } from "@/features/_shared/dumped-contract-boundary";
import { DUMPED_OVERVIEW_COMMANDS } from "./dumped-contract";

export function OverviewContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="overview" commands={DUMPED_OVERVIEW_COMMANDS} />
      <OverviewPage />
    </>
  );
}
