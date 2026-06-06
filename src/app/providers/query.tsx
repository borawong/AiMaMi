/**
 * 中文职责说明：提供全局 TanStack Query 客户端，确保缓存事实源只有一个。
 */
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createAppQueryClient } from "@/lib/query";

const queryClient = createAppQueryClient();

export function AppQueryClientProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
