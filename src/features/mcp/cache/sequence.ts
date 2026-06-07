export type McpCachePayloadSource = "full-refresh" | "mutation-payload";

let mcpCacheSequence = 0;
let mcpLatestAcceptedSequence = 0;

export function nextMcpCacheSequence() {
  mcpCacheSequence += 1;
  return mcpCacheSequence;
}

export function acceptMcpCacheSequence(sequence: number) {
  if (sequence < mcpLatestAcceptedSequence) {
    return false;
  }

  mcpLatestAcceptedSequence = sequence;
  return true;
}
