/**
 * 中文职责说明：显式声明空状态响应场景，验证 UI 不把空状态误判为失败。
 */
import type { E2eScenario } from "./types";

export const emptyScenario: E2eScenario = {
  kind: "empty",
  commands: ["all"],
  steps: [
    { name: "empty-response", delayMs: 0, outcome: "resolve-empty", sequence: 1 },
  ],
};
