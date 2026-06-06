/**
 * 中文职责说明：模拟请求失败，验证失败路径不清空已有 TanStack cache 事实。
 */
import type { E2eScenario } from "./types";

export const failureScenario: E2eScenario = {
  kind: "failure",
  commands: ["all"],
  steps: [
    { name: "seed-cache", delayMs: 0, outcome: "resolve", sequence: 1 },
    { name: "failing-refresh", delayMs: 120, outcome: "reject", sequence: 2 },
  ],
};
