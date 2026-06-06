/**
 * 中文职责说明：模块运行时挂载 dumped 前端合同边界，确保恢复清单归属到具体 feature owner。
 */
import type { Route } from "@/types/navigation";

export interface DumpedContractCommandBoundary {
  command: string;
  argKeys: readonly string[];
  wrappers: readonly string[];
  controlFlowCount: number;
}

export function DumpedContractBoundary({
  moduleId,
  commands,
}: {
  moduleId: Route;
  commands: readonly DumpedContractCommandBoundary[];
}) {
  void moduleId;
  void commands;
  return null;
}
