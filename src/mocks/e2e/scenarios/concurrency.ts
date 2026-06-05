/**
 * 中文职责说明：模拟并发刷新，验证 single-flight 只接受最新请求结果。
 */
import type { E2eScenario } from "./types";

export const concurrencyScenario: E2eScenario = {
  kind: "concurrency",
  commands: ["all"],
  steps: [
    { name: "first-flight", delayMs: 500, outcome: "resolve", sequence: 7 },
    { name: "second-flight", delayMs: 100, outcome: "resolve", sequence: 8 },
  ],
};
