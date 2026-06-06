import { abortScenario } from "./abort";
import { cancelScenario } from "./cancel";
import { concurrencyScenario } from "./concurrency";
import { delayedScenario } from "./delayed";
import { emptyScenario } from "./empty";
import { eventReplayScenario } from "./replay";
import { failureScenario } from "./failure";
import { normalScenario } from "./normal";
import { staleScenario } from "./stale";
import type { E2eScenario, E2eScenarioConfig, E2eScenarioKind } from "./types";

export const E2E_SCENARIO_KINDS = [
  "normal",
  "empty",
  "failure",
  "delayed",
  "stale",
  "concurrency",
  "cancel",
  "abort",
  "event-replay",
] as const satisfies readonly E2eScenarioKind[];

export const e2eScenarioPresets = {
  normal: normalScenario,
  empty: emptyScenario,
  failure: failureScenario,
  delayed: delayedScenario,
  stale: staleScenario,
  concurrency: concurrencyScenario,
  cancel: cancelScenario,
  abort: abortScenario,
  "event-replay": eventReplayScenario,
} as const satisfies Record<E2eScenarioKind, E2eScenario>;

export function getE2eScenario(kind: E2eScenarioKind) {
  return e2eScenarioPresets[kind];
}

export function createE2eScenarioConfig(
  config: Partial<E2eScenarioConfig> = {},
): E2eScenarioConfig {
  return {
    kind: config.kind ?? "normal",
    command: config.command,
  };
}

export { abortScenario } from "./abort";
export { cancelScenario } from "./cancel";
export { concurrencyScenario } from "./concurrency";
export { delayedScenario } from "./delayed";
export { emptyScenario } from "./empty";
export { eventReplayScenario } from "./replay";
export { failureScenario } from "./failure";
export { normalScenario } from "./normal";
export { SKILLS_E2E_COMMANDS } from "./skills";
export { staleScenario } from "./stale";
export type {
  E2eScenario,
  E2eScenarioCommandSelector,
  E2eScenarioConfig,
  E2eScenarioKind,
  E2eScenarioOutcome,
  E2eScenarioStep,
} from "./types";
