/**
 * 中文职责说明：IPC 命令 fixture registry 只固化合同证据元信息，默认 handler 不伪造业务返回。
 */
import {
  IPC_COMMAND_DEFINITIONS,
  type IpcArgs,
  type IpcCommandName,
} from "@/contracts/ipc";
import type { CoreEnvelope } from "@/types";
import type { IpcMockStepResult } from "@/mocks/ipc";
import {
  createEvidenceBackedIpcFixture,
  type EvidenceBackedIpcFixture,
} from "./index";

export interface IpcCommandFixture {
  argKeys: readonly string[];
  command: IpcCommandName;
  domain: (typeof IPC_COMMAND_DEFINITIONS)[number]["domain"];
  handler: IpcCommandHandler;
  source: (typeof IPC_COMMAND_DEFINITIONS)[number]["source"];
  tier: (typeof IPC_COMMAND_DEFINITIONS)[number]["tier"];
  wrapperNames: readonly string[];
}

export type IpcCommandHandler = (context: {
  args?: IpcArgs;
  command: IpcCommandName;
  steps: IpcMockStepResult[];
}) => CoreEnvelope<EvidenceBackedIpcFixture>;

export function createDefaultIpcCommandHandler(): IpcCommandHandler {
  return ({ args, command, steps }) =>
    createEvidenceBackedIpcFixture(command, args, steps);
}

const defaultHandler = createDefaultIpcCommandHandler();

export const ipcCommandFixtures = IPC_COMMAND_DEFINITIONS.reduce(
  (fixtures, definition) => {
    fixtures[definition.command] = {
      argKeys: definition.argKeys,
      command: definition.command,
      domain: definition.domain,
      handler: defaultHandler,
      source: definition.source,
      tier: definition.tier,
      wrapperNames: definition.wrapperNames,
    };
    return fixtures;
  },
  {} as Record<IpcCommandName, IpcCommandFixture>,
);

export function getIpcCommandFixture(command: IpcCommandName) {
  return ipcCommandFixtures[command];
}

export function assertIpcFixtureCoverage() {
  const missing = IPC_COMMAND_DEFINITIONS.filter(
    (definition) => !ipcCommandFixtures[definition.command],
  ).map((definition) => definition.command);

  return {
    covered: IPC_COMMAND_DEFINITIONS.length - missing.length,
    missing,
    total: IPC_COMMAND_DEFINITIONS.length,
  };
}
