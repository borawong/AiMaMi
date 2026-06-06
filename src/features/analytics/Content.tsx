import { AnalyticsPage } from "./components/analytics-page";
import { DumpedContractBoundary } from "@/features/_shared/dumped-contract-boundary";
import { DUMPED_ANALYTICS_COMMANDS } from "./dumped-contract";

export function AnalyticsContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="analytics" commands={DUMPED_ANALYTICS_COMMANDS} />
      <AnalyticsPage />
    </>
  );
}
