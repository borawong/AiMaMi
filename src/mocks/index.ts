export { createIpcMockResponse, mockableIpcCommands, unsupportedIpcMock } from "./ipc";
export {
  createIpcMockConfig,
  resolveIpcMockSteps,
  type IpcMockConfig,
  type IpcMockStepResult,
} from "./ipc";
export {
  E2E_SCENARIO_KINDS,
  createE2eScenarioConfig,
  e2eScenarioPresets,
  getE2eScenario,
  type E2eScenario,
  type E2eScenarioConfig,
  type E2eScenarioKind,
  type E2eScenarioOutcome,
  type E2eScenarioStep,
} from "./e2e/scenarios";
export {
  createEvidenceBackedIpcFixture,
  fixturePolicy,
  type EvidenceBackedIpcFixture,
} from "./fixtures";
export {
  assertIpcFixtureCoverage,
  createDefaultIpcCommandHandler,
  getIpcCommandFixture,
  ipcCommandFixtures,
  type IpcCommandFixture,
  type IpcCommandHandler,
} from "./fixtures/ipc-command-fixtures";
