/**
 * 中文职责说明：mcp 模块 Content 接入页面组件和 dumped 合同 owner，不在 route shell 中持有业务状态。
 */
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
