/**
 * 中文职责说明：显式声明正常响应场景，作为 mock 配置入口而非状态架构验收依据。
 */
import type { E2eScenario } from "./types";

export const normalScenario: E2eScenario = {
  kind: "normal",
  commands: ["all"],
  steps: [{ name: "normal-response", delayMs: 0, outcome: "resolve", sequence: 1 }],
};
