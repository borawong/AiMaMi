import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AnalyticsAuthoritativeQueryKeys,
  fenceAnalyticsPanelPayload,
} from "@/features/analytics/cache";
import { sessionsService } from "@/services/sessions";
import {
  invalidateSessionsDumpedQueries,
  nextSessionsCacheSequence,
  writeSessionsMutationPayload,
} from "../cache";
import type {
  SessionsDeleteEnvelope,
  SessionsPageMutations,
} from "../types";

export function useSessionsPageMutations({
  refreshSessions,
  refreshUsage,
}: {
  refreshSessions: () => Promise<void>;
  refreshUsage: () => Promise<void>;
}): SessionsPageMutations {
  const queryClient = useQueryClient();
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  const deleteSessionsMutation = useMutation({
    mutationFn: (ids: string[]) => sessionsService.deleteSessions(ids),
    onSuccess: (payload: SessionsDeleteEnvelope) => {
      const mutationEnvelope = writeSessionsMutationPayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: nextSessionsCacheSequence(),
        receivedAt: Date.now(),
      });
      fenceAnalyticsPanelPayload(
        queryClient,
        AnalyticsAuthoritativeQueryKeys.usage,
        mutationEnvelope,
      );
      void invalidateSessionsDumpedQueries(queryClient);
    },
  });

  const refreshSessionsData = () => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = Promise.all([
        refreshSessions(),
        refreshUsage(),
      ])
        .then(() => undefined)
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }
    return refreshPromiseRef.current;
  };

  return {
    refreshAction: {
      run: refreshSessionsData,
      isPending: false,
    },
    deleteSessions: {
      run: (ids: string[]) => deleteSessionsMutation.mutateAsync(ids),
      isPending: deleteSessionsMutation.isPending,
    },
  };
}
