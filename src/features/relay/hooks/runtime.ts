import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { relayService } from "@/services/relay";
import {
  RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY,
  type RelayRouterToggleProgress,
  writeRelayRouterToggleProgress,
} from "../cache";
import { isRecord } from "../utils";

function parseRelayRouterToggleProgress(
  payload: unknown,
): RelayRouterToggleProgress | null {
  if (!isRecord(payload)) return null;
  const step = readFiniteNumber(payload.step, 0);
  const total = Math.max(readFiniteNumber(payload.total, 1), 1);
  const label = typeof payload.label === "string" ? payload.label : "writing_config";

  return {
    label,
    step: Math.min(Math.max(step, 0), total),
    total,
    current: readOptionalFiniteNumber(payload.current),
    totalItems:
      readOptionalFiniteNumber(payload.total_items) ??
      readOptionalFiniteNumber(payload.totalItems),
    receivedAt: Date.now(),
  };
}

function readFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readOptionalFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function useRelayRouterToggleProgressCache(queryClient: QueryClient) {
  queryClient.getQueryData<RelayRouterToggleProgress>(
    RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY,
  );

  useEffect(() => {
    return relayService.subscribeRouterToggleProgress((payload) => {
      const nextProgress = parseRelayRouterToggleProgress(payload);
      if (!nextProgress) return;
      writeRelayRouterToggleProgress(queryClient, nextProgress);
    });
  }, [queryClient]);
}

export function useRelayRouterToggleProgress() {
  const queryClient = useQueryClient();
  useRelayRouterToggleProgressCache(queryClient);
}

export function useRelayRuntimeEvents() {
  useRelayRouterToggleProgress();
}
