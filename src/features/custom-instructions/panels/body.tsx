import type { CustomInstructionsPageController } from "../hooks";
import { CustomInstructionsConfigurePanel } from "./configure";
import { CustomInstructionsTemplatesPanel } from "./templates";

type CustomInstructionsPageBodyPanelProps =
  CustomInstructionsPageController["bodyPanel"];

export function CustomInstructionsPageBodyPanel({
  tab,
  configure,
  templates,
}: CustomInstructionsPageBodyPanelProps) {
  return tab === "templates" ? (
    <CustomInstructionsTemplatesPanel {...templates} />
  ) : (
    <CustomInstructionsConfigurePanel {...configure} />
  );
}
