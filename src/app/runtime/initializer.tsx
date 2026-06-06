import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { seedDesktopMessageBoundary } from "@/app/runtime/message";
import {
  applyRuntimeEventToQueryCache,
  subscribeRuntimeEvent,
} from "@/app/runtime/events";

export function RuntimeInitializer() {
  const queryClient = useQueryClient();

  useEffect(() => {
    seedDesktopMessageBoundary(queryClient);
  }, [queryClient]);

  useEffect(() => {
    return subscribeRuntimeEvent((event) => {
      applyRuntimeEventToQueryCache(queryClient, event);
    });
  }, [queryClient]);

  return null;
}
