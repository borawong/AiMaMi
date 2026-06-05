/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-control-flow.jsonl
Frontend module: contracts/ipc/invoke
This file is a structured reconstruction scaffold, not recovered original source.
*/
import type { IpcCommandName } from "./commands";
import { isTauriRuntime } from "@/lib/tauri-runtime";

export type IpcArgs = Record<string, unknown>;

export async function invokeIpc<T>(
  command: IpcCommandName,
  args?: IpcArgs,
): Promise<T> {
  if (isTauriRuntime()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<T>(command, args);
  }

  throw new Error(`Command "${command}" is only available in Tauri runtime`);
}
