/**
 * 中文职责说明：无 UI runtime 初始化层，只负责事件订阅、cache 写入和模块 reload 调度。
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  applyRuntimeEventToQueryCache,
  subscribeRuntimeEvent,
} from "@/app/runtime/runtime-events";

export function RuntimeInitializer() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return subscribeRuntimeEvent((event) => {
      applyRuntimeEventToQueryCache(queryClient, event);
    });
  }, [queryClient]);

  return null;
}
