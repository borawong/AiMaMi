import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { DUMPED_SKILLS_COMMANDS } from "./contract";
import { SkillsConfirmDialogs } from "./dialogs";
import { useSkillsPageController } from "./hooks";
import { SkillsPagePanel } from "./panels";

export function SkillsContent() {
  const controller = useSkillsPageController();

  return (
    <>
      <DumpedContractBoundary moduleId="skills" commands={DUMPED_SKILLS_COMMANDS} />
      <SkillsPagePanel controller={controller} />
      <SkillsConfirmDialogs controller={controller} />
    </>
  );
}
