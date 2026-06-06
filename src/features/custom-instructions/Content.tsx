/**
 * 中文职责说明：custom-instructions 模块 Content 接入页面组件和 dumped 合同 owner，不在 route shell 中持有业务状态。
 */
import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { CustomInstructionsPage } from "./components/page";
import { DUMPED_CUSTOM_INSTRUCTIONS_COMMANDS } from "./contract";

export function CustomInstructionsContent() {
  return (
    <>
      <DumpedContractBoundary
        moduleId="custom-instructions"
        commands={DUMPED_CUSTOM_INSTRUCTIONS_COMMANDS}
      />
      <CustomInstructionsPage />
    </>
  );
}
