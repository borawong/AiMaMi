/**
 * 中文职责说明：集中声明 IPC mock 可覆盖命令和状态竞争配置，不绕过 IPC 合同语义。
 */
import {
  IPC_COMMAND_DEFINITIONS,
  type IpcArgs,
  type IpcCommandName,
} from "@/contracts/ipc";
import {
  createE2eScenarioConfig,
  getE2eScenario,
  type E2eScenarioConfig,
  type E2eScenarioKind,
  type E2eScenarioOutcome,
} from "@/mocks/e2e/scenarios";

export const mockableIpcCommands = IPC_COMMAND_DEFINITIONS.map((item) => item.command);

export interface IpcMockConfig extends E2eScenarioConfig {
  command?: IpcCommandName;
}

export interface IpcMockStepResult {
  args?: IpcArgs;
  command: IpcCommandName;
  delayMs: number;
  outcome: E2eScenarioOutcome;
  scenario: E2eScenarioKind;
  sequence: number;
  stepName: string;
}

export function createIpcMockConfig(
  config: Partial<IpcMockConfig> = {},
): IpcMockConfig {
  return createE2eScenarioConfig(config);
}

export function resolveIpcMockSteps(
  command: IpcCommandName,
  args: IpcArgs | undefined,
  config: Partial<IpcMockConfig> = {},
): IpcMockStepResult[] {
  const scenarioConfig = createIpcMockConfig({
    ...config,
    command: config.command ?? command,
  });
  const scenario = getE2eScenario(scenarioConfig.kind);

  return scenario.steps
    .filter((step) => !step.command || step.command === command)
    .map((step) => ({
      args,
      command,
      delayMs: step.delayMs,
      outcome: step.outcome,
      scenario: scenario.kind,
      sequence: step.sequence,
      stepName: step.name,
    }));
}

export function unsupportedIpcMock(command: IpcCommandName): never {
  throw new Error(`IPC mock/stub has no evidence-backed response for command "${command}"`);
}
