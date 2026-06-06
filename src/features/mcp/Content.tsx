import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { McpPage } from "./components/page";
import { DUMPED_MCP_COMMANDS } from "./contract";

export function McpContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="mcp" commands={DUMPED_MCP_COMMANDS} />
      <McpPage />
    </>
  );
}
