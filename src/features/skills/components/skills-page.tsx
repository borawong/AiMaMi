/**
 * 中文职责说明：skills 页面是 route/module shell，只装配 controller、panel 和 dialogs。
 */
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
