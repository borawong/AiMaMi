import { SettingsFeature, type SettingsFeatureProps } from "@/features/settings";

export type SettingsRouteProps = SettingsFeatureProps;

export function SettingsRoute(props: SettingsRouteProps) {
  return <SettingsFeature {...props} />;
}
