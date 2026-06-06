import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export type RefreshInterval = "30s" | "1m" | "3m" | "5m";

const INTERVALS: Record<RefreshInterval, number> = {
  "30s": 30_000,
  "1m": 60_000,
  "3m": 180_000,
  "5m": 300_000,
};

export function useAutoRefresh() {
  const { t } = useTranslation();
  const saveRequestIdRef = useRef(0);
  const [interval, setIntervalState] = useState<RefreshInterval>(() => {
    const stored = localStorage.getItem("refresh_interval") as RefreshInterval;
    if (stored && stored in INTERVALS) return stored;
    return "1m";
  });

  const applyResolvedInterval = (value: string) => {
    if (!(value in INTERVALS)) {
      return;
    }
    const next = value as RefreshInterval;
    setIntervalState(next);
    localStorage.setItem("refresh_interval", next);
  };

  const setInterval_ = (v: RefreshInterval) => {
    const requestId = ++saveRequestIdRef.current;

    void api.setUsageRefreshInterval(v)
      .then((saved) => {
        if (requestId !== saveRequestIdRef.current) {
          return;
        }
        applyResolvedInterval(saved);
      })
      .catch(async () => {
        if (requestId !== saveRequestIdRef.current) {
          return;
        }
        try {
          applyResolvedInterval(await api.getUsageRefreshInterval());
        } catch {
          // 最新状态无法重新加载时，保留当前显示。
        }
        toast({
          title: t("settings.refreshIntervalSaveFailedTitle"),
          description: t("settings.refreshIntervalSaveFailedDesc"),
          variant: "destructive",
        });
      });
  };

  useEffect(() => {
    let cancelled = false;
    void api.getUsageRefreshInterval()
      .then((value) => {
        if (cancelled) {
          return;
        }
        applyResolvedInterval(value);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return { refreshInterval: interval, setRefreshInterval: setInterval_ };
}

export const REFRESH_OPTIONS: { value: RefreshInterval; labelKey: string }[] = [
  { value: "30s", labelKey: "settings.refresh30s" },
  { value: "1m", labelKey: "settings.refresh1m" },
  { value: "3m", labelKey: "settings.refresh3m" },
  { value: "5m", labelKey: "settings.refresh5m" },
];
