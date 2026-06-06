/**
 * 中文职责说明：模拟旧响应晚于新 mutation 返回，验证旧响应不得覆盖权威 payload。
 */
import type { E2eScenario } from "./types";

export const staleScenario: E2eScenario = {
  kind: "stale",
  commands: ["all"],
  steps: [
    { name: "old-refresh", delayMs: 400, outcome: "resolve", sequence: 1 },
    {
      name: "authoritative-mutation",
      delayMs: 50,
      outcome: "resolve",
      sequence: 2,
    },
  ],
};
