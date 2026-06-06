/**
 * 中文职责说明：analytics route shell 只负责路由装配和模块 Provider 接入。
 */
import { AnalyticsFeature } from "@/features/analytics";

export function AnalyticsRoute() {
  return <AnalyticsFeature />;
}
