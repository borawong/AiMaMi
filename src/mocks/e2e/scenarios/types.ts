import type { IpcCommandName } from "@/contracts/ipc";

export type E2eScenarioKind =
  | "normal"
  | "empty"
  | "failure"
  | "delayed"
  | "stale"
  | "concurrency"
  | "cancel"
  | "abort"
  | "event-replay";

export type E2eScenarioOutcome =
  | "resolve"
  | "resolve-empty"
  | "reject"
  | "cancel"
  | "abort"
  | "replay";

export type E2eScenarioCommandSelector = IpcCommandName | "all";

export interface E2eScenarioStep {
  command?: IpcCommandName;
  delayMs: number;
  name: string;
  outcome: E2eScenarioOutcome;
  sequence: number;
}

export interface E2eScenario {
  commands: readonly E2eScenarioCommandSelector[];
  kind: E2eScenarioKind;
  steps: readonly E2eScenarioStep[];
}

export interface E2eScenarioConfig {
  command?: IpcCommandName;
  kind: E2eScenarioKind;
}
