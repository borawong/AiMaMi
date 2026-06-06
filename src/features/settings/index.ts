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
