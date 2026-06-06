/**
 * 中文职责说明：custom-instructions route shell 只负责路由装配和模块 Provider 接入。
 */
import { CustomInstructionsFeature } from "@/features/custom-instructions";

export function CustomInstructionsRoute() {
  return <CustomInstructionsFeature />;
}
