import { AnalyticsPage } from "./components/page";
import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { DUMPED_ANALYTICS_COMMANDS } from "./contract";

export function AnalyticsContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="analytics" commands={DUMPED_ANALYTICS_COMMANDS} />
      <AnalyticsPage />
    </>
  );
}
