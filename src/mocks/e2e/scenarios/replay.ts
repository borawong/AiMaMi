/**
 * 中文职责说明：模拟 runtime 事件重放，验证 replay 不覆盖已写入的 mutation payload。
 */
import type { E2eScenario } from "./types";

export const eventReplayScenario: E2eScenario = {
  kind: "event-replay",
  commands: ["all"],
  steps: [
    { name: "mutation-payload", delayMs: 0, outcome: "resolve", sequence: 10 },
    { name: "replayed-event", delayMs: 40, outcome: "replay", sequence: 9 },
  ],
};
