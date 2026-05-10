import { invoke } from "@tauri-apps/api/core";

/**
 * macOS 系统设置「隐私与安全性」各子面板标识。
 *
 * 实际 URL 在 Rust 侧维护并通过 `/usr/bin/open` 打开，前端只传 pane key，
 * 避免因 `plugin-shell` 默认 scope 将 `x-apple.systempreferences:` 拦截而报错。
 */
export type MacOSPrivacyPane =
  | "microphone"
  | "speech"
  | "accessibility"
  | "automation";

/** 通过 Tauri 命令打开指定的 macOS 隐私面板。 */
export async function openMacOSPrivacyPane(pane: MacOSPrivacyPane): Promise<void> {
  await invoke<void>("open_macos_privacy_pane", { pane });
}
