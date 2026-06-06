/**
 * 中文职责说明：模块 query hook 的共享执行器，提供 single-flight、abort、delayed response 和 replay 防护。
 */
import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ModuleCacheOwner, ModuleCacheSource } from "@/features/_shared/cache";

export interface ModuleRefreshRequest<TPayload> {
  source: ModuleCacheSource;
  load: (signal: AbortSignal) => Promise<TPayload>;
}

export function useModuleCacheController(cacheOwner: ModuleCacheOwner) {
  const queryClient = useQueryClient();
  const sequenceRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(
    async <TPayload,>({ source, load }: ModuleRefreshRequest<TPayload>) => {
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;
      const sequence = ++sequenceRef.current;
      const payload = await load(abortController.signal);

      if (abortController.signal.aborted || sequence !== sequenceRef.current) {
        return null;
      }

      return cacheOwner.writeAuthoritativePayload(queryClient, {
        payload,
        source,
        sequence,
        receivedAt: Date.now(),
      });
    },
    [cacheOwner, queryClient],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return {
    refresh,
    cancel,
    invalidate: () => cacheOwner.invalidateContractQueries(queryClient),
  };
}
