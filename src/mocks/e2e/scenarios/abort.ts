/**
 * 中文职责说明：模拟 AbortController 中止，验证 abort 后结果不得写入 cache。
 */
import type { E2eScenario } from "./types";

export const abortScenario: E2eScenario = {
  kind: "abort",
  commands: ["all"],
  steps: [
    { name: "aborted-request", delayMs: 300, outcome: "abort", sequence: 5 },
    { name: "next-request", delayMs: 60, outcome: "resolve", sequence: 6 },
  ],
};
