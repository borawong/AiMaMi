import { useCallback, useState } from "react";
import { flushSync } from "react-dom";

interface UseBusyActionOptions {
  minVisibleMs?: number;
}

function nextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export function useBusyAction(options?: UseBusyActionOptions) {
  const minVisibleMs = options?.minVisibleMs ?? 600;
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async <T,>(action: () => Promise<T>) => {
      if (busy) return undefined as T | undefined;

      flushSync(() => {
        setBusy(true);
      });
      await nextPaint();

      const startedAt = Date.now();
      try {
        return await action();
      } finally {
        const elapsedMs = Date.now() - startedAt;
        if (elapsedMs < minVisibleMs) {
          await new Promise((resolve) => setTimeout(resolve, minVisibleMs - elapsedMs));
        }
        setBusy(false);
      }
    },
    [busy, minVisibleMs],
  );

  return { busy, run };
}
