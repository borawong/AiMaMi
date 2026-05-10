import { getCurrentWindow } from "@tauri-apps/api/window";

export function isTauriRuntime(): boolean {
  return !!(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
}

export function getTauriWindowLabel(): string {
  if (!isTauriRuntime()) return "main";
  return getCurrentWindow().label;
}
