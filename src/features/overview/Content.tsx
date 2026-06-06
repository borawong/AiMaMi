import { OverviewPage } from "./components/page";
import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { DUMPED_OVERVIEW_COMMANDS } from "./contract";

export function OverviewContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="overview" commands={DUMPED_OVERVIEW_COMMANDS} />
      <OverviewPage />
    </>
  );
}
