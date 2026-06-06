/**
 * 中文职责说明：模拟用户取消或关闭中的刷新，验证被取消结果不得写入 cache。
 */
import type { E2eScenario } from "./types";

export const cancelScenario: E2eScenario = {
  kind: "cancel",
  commands: ["all"],
  steps: [
    { name: "cancelled-refresh", delayMs: 300, outcome: "cancel", sequence: 5 },
    { name: "replacement-refresh", delayMs: 60, outcome: "resolve", sequence: 6 },
  ],
};
