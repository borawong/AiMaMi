/**
 * 中文职责说明：启动前设置特殊窗口的透明背景，仅处理宿主 DOM 外观。
 */
import { getTauriWindowLabel } from "@/lib/tauri";

const TRANSPARENT_WINDOW_LABELS = new Set([
  "hotspot",
  "voice-overlay",
  "voice-search-overlay",
]);

export function applyWindowSurfaceStyle() {
  if (!TRANSPARENT_WINDOW_LABELS.has(getTauriWindowLabel())) {
    return;
  }

  document.documentElement.style.cssText =
    "background:transparent!important;margin:0;padding:0;overflow:hidden;height:100%";
  document.body.style.cssText =
    "background:transparent!important;margin:0;padding:0;overflow:hidden;height:100%";

  const root = document.getElementById("root");
  if (root) {
    root.style.cssText = "background:transparent;height:100%;width:100%";
  }
}
