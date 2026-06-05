/**
 * 中文职责说明：settings 模块唯一公共入口，外部只能通过这里接入模块。
 */
import { createElement } from "react";
import { SettingsProvider } from "./Provider";
import { SettingsContent, type SettingsContentProps } from "./Content";

export type SettingsFeatureProps = SettingsContentProps;

export function SettingsFeature(props: SettingsFeatureProps) {
  return createElement(
    SettingsProvider,
    null,
    createElement(SettingsContent, props),
  );
}

export { SettingsProvider } from "./Provider";
export { SettingsContent, type SettingsContentProps } from "./Content";
