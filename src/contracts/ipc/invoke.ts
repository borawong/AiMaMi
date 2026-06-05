import type { IpcCommandName } from "./commands";
import type { IpcArgs } from "./dto";
import { isTauriRuntime } from "@/lib/tauri-runtime";

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
