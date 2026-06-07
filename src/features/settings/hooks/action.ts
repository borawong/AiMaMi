import { useBusyAction } from "@/hooks/busy";

export function useSettingsBusyActions() {
  return {
    updateCheckAction: useBusyAction({ minVisibleMs: 600 }),
    detectProxyAction: useBusyAction({ minVisibleMs: 600 }),
    testProxyAction: useBusyAction({ minVisibleMs: 600 }),
    saveProxyAction: useBusyAction({ minVisibleMs: 600 }),
  };
}
