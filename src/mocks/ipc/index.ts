/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-control-flow.jsonl
Frontend module: mocks/ipc
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { IPC_COMMAND_DEFINITIONS, type IpcCommandName } from "@/contracts/ipc";

export const mockableIpcCommands = IPC_COMMAND_DEFINITIONS.map((item) => item.command);

export function unsupportedIpcMock(command: IpcCommandName): never {
  throw new Error(`IPC mock/stub has no evidence-backed response for command "${command}"`);
}
