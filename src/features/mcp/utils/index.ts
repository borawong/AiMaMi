/**
 * 中文职责说明：mcp utils 只处理前端表单草稿、分页和文本解析，不调用 IPC 或写入后端事实。
 */
import type { UpsertMcpServerInput } from "@/services/mcp";
import type { McpServerSummary, McpTransport } from "@/types";
import type {
  McpPaginationItem,
  McpServerFormDraft,
} from "../types";

export const MCP_PAGE_SIZE = 15;
export const MCP_TRANSPORTS: McpTransport[] = ["stdio", "http", "sse"];

export function createMcpServerFormDraft(
  server?: McpServerSummary,
): McpServerFormDraft {
  return {
    name: server?.name ?? "",
    transport: server?.transport ?? "stdio",
    command: server?.command ?? "",
    args: server?.args.join(", ") ?? "",
    url: server?.url ?? "",
    envText: stringifyKeyValueLines(server?.environment, "="),
    headersText: stringifyKeyValueLines(server?.headers, ":"),
  };
}

export function buildMcpServerInput(
  draft: McpServerFormDraft,
): UpsertMcpServerInput {
  const isStdio = draft.transport === "stdio";

  return {
    name: draft.name,
    transport: draft.transport,
    enabled: true,
    command: isStdio ? draft.command : undefined,
    args: isStdio ? splitArgs(draft.args) : [],
    url: isStdio ? undefined : draft.url,
    headers: parseKeyValueLines(draft.headersText, ":"),
    environment: parseKeyValueLines(draft.envText, "="),
  };
}

export function getMcpServerCommandLine(server: McpServerSummary) {
  return [
    server.command,
    server.args.length > 0 ? server.args.join(" ") : "",
    server.url ?? "",
  ].filter(Boolean).join(" ");
}

export function getMcpPagination<TItem>(
  items: TItem[],
  currentPage: number,
  pageSize = MCP_PAGE_SIZE,
) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  return {
    currentPage,
    safePage,
    totalPages,
    pagedItems: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    range: getPaginationRange(safePage, totalPages),
  };
}

function getPaginationRange(
  safePage: number,
  totalPages: number,
): McpPaginationItem[] {
  const range: McpPaginationItem[] = [];

  if (totalPages <= 7) {
    for (let page = 1; page <= totalPages; page += 1) range.push(page);
    return range;
  }

  range.push(1);
  if (safePage > 3) range.push("ellipsis");

  const start = Math.max(2, safePage - 1);
  const end = Math.min(totalPages - 1, safePage + 1);
  for (let page = start; page <= end; page += 1) range.push(page);

  if (safePage < totalPages - 2) range.push("ellipsis");
  range.push(totalPages);

  return range;
}

function stringifyKeyValueLines(
  value: Record<string, string> | undefined,
  separator: ":" | "=",
) {
  if (!value) return "";

  return Object.entries(value)
    .map(([key, item]) => `${key}${separator === ":" ? ": " : "="}${item}`)
    .join("\n");
}

function parseKeyValueLines(
  text: string,
  separator: ":" | "=",
): Record<string, string> {
  const result: Record<string, string> = {};

  text.split("\n").filter(Boolean).forEach((line) => {
    const index = line.indexOf(separator);
    if (index <= 0) return;

    result[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  });

  return result;
}

function splitArgs(args: string) {
  return args.split(",").map((arg) => arg.trim()).filter(Boolean);
}
