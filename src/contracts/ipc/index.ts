/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: contracts/ipc/index
This file is a structured reconstruction scaffold, not recovered original source.
Deep module boundary: consumers import IPC contracts from this entrypoint.
*/
export {
  IPC_COMMAND_DEFINITIONS,
  IPC_COMMAND_DOMAINS,
  getIpcCommandDefinition,
  getIpcCommandsForDomain,
  type IpcCommandDefinition,
  type IpcCommandDomain,
  type IpcCommandName,
} from "./commands";
export { invokeIpc, type IpcArgs } from "./invoke";
