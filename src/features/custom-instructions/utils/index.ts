/**
 * 中文职责说明：custom-instructions 模块 UI 辅助只表达已证实状态到样式的映射，不写业务规则。
 */
import type { CustomInstructionStatePayload } from "@/types";

export function getCustomInstructionProtectionTone(
  state: CustomInstructionStatePayload["current"]["protectionState"],
) {
  switch (state) {
    case "ready":
      return "border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300";
    case "protected":
      return "border-destructive/20 bg-destructive/8 text-destructive";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}
