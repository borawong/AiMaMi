/**
 * 中文职责说明：settings route shell 只负责路由装配和模块 Provider 接入。
 */
import { SettingsFeature, type SettingsFeatureProps } from "@/features/settings";

export type SettingsRouteProps = SettingsFeatureProps;

export function SettingsRoute(props: SettingsRouteProps) {
  return <SettingsFeature {...props} />;
}
