/**
 * 中文职责说明：侧栏持久化 hook 只拥有全局导航壳的展开状态和本地存储同步。
 */
import { useCallback, useState } from "react";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "sidebar_collapsed";

export function useSidebarOpenState() {
  const [sidebarOpen, setSidebarOpenState] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "false",
  );

  const setSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpenState(open);
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(!open));
  }, []);

  return {
    sidebarOpen,
    setSidebarOpen,
  };
}
