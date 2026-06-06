import type { QueryClient } from "@tanstack/react-query";

// 中文职责说明：desktop-message 是 raw 主 chunk 中的全局消息查询 owner；当前证据只证明 queryKey、staleTime 和空参数读取入口。
export const DESKTOP_MESSAGE_QUERY_KEY = ["desktop-message"] as const;
export const DESKTOP_MESSAGE_STALE_TIME = 60_000;

export interface DesktopMessagePayload {
  title?: string | null;
  body?: string | null;
  imageUrl?: string | null;
}

// 中文职责说明：raw 只暴露 getDesktopMessage 调用点，未公开远端协议或 IPC 命令；因此公开仓库只保留可替换的边界读取。
export async function loadDesktopMessageBoundary(): Promise<DesktopMessagePayload | null> {
  return null;
}

export function seedDesktopMessageBoundary(queryClient: QueryClient) {
  queryClient.setQueryData<DesktopMessagePayload | null>(
    DESKTOP_MESSAGE_QUERY_KEY,
    (current) => current ?? null,
  );
}
