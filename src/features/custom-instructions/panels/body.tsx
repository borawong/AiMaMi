/**
 * 中文职责说明：页面主体面板只根据 controller tab 装配配置或模板面板。
 */
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
