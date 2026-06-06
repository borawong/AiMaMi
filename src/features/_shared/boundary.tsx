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
