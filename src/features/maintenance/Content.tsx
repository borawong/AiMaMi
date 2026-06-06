import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { MaintenancePage } from "./components/page";
import { DUMPED_MAINTENANCE_COMMANDS } from "./contract";

export function MaintenanceContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="maintenance" commands={DUMPED_MAINTENANCE_COMMANDS} />
      <MaintenancePage />
    </>
  );
}
