import { useEffect, useState } from "react";

export function useDeferredReady(timeoutMs = 300) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let frame1 = 0;
    let frame2 = 0;
    let timeoutId: number | undefined;
    let idleId: number | undefined;

    const finish = () => {
      if (!cancelled) {
        setReady(true);
      }
    };

    const scheduleIdle = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(finish, { timeout: timeoutMs });
      }
      timeoutId = window.setTimeout(finish, timeoutMs);
    };

    frame1 = window.requestAnimationFrame(() => {
      frame2 = window.requestAnimationFrame(scheduleIdle);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame1);
      window.cancelAnimationFrame(frame2);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [timeoutMs]);

  return ready;
}
