import { SkillsConfirmDialogs } from "../dialogs";
import { useSkillsPageController } from "../hooks";
import { SkillsPagePanel } from "../panels";

export function SkillsPage() {
  const controller = useSkillsPageController();

  return (
    <>
      <SkillsPagePanel controller={controller} />
      <SkillsConfirmDialogs controller={controller} />
    </>
  );
}
