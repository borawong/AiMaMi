/**
 * 中文职责说明：skills 模块 Content 接入页面组件和 dumped 合同 owner，不在 route shell 中持有业务状态。
 */
import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { SkillsPage } from "./components/page";
import { DUMPED_SKILLS_COMMANDS } from "./contract";

export function SkillsContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="skills" commands={DUMPED_SKILLS_COMMANDS} />
      <SkillsPage />
    </>
  );
}
