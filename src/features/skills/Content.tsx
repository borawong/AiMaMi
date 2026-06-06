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
