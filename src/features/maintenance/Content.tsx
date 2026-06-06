/**
 * 中文职责说明：maintenance 模块 Content 接入页面组件和 dumped 合同 owner，不在 route shell 中持有业务状态。
 */
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
