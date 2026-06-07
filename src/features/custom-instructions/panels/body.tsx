import type { CustomInstructionsBodyPanelController } from "../types";
import { CustomInstructionsConfigurePanel } from "./configure";
import { CustomInstructionsTemplatesPanel } from "./templates";

export function CustomInstructionsPageBodyPanel({
  tab,
  configure,
  templates,
}: CustomInstructionsBodyPanelController) {
  return tab === "templates" ? (
    <CustomInstructionsTemplatesPanel {...templates} />
  ) : (
    <CustomInstructionsConfigurePanel {...configure} />
  );
}
