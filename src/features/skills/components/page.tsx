import { SkillsContent } from "../Content";
import { SkillsProvider } from "../Provider";

export function SkillsPage() {
  return (
    <SkillsProvider>
      <SkillsContent />
    </SkillsProvider>
  );
}
