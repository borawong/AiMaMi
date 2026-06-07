import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  SessionsDeletePayload,
  SessionsListPayload,
  UsageAnalyticsPayload,
} from "@/types";
import type {
  SessionMetricItem,
  SessionsDeleteRequest,
  SessionsModuleController,
  SessionsPageController,
} from "../types";
import {
  buildSessionGroups,
  countOrphans,
  flattenGroups,
  formatBytes,
  readNumber,
  selectDeletedSessionIds,
  selectSessionRecords,
  selectSessionsEnvelopeData,
  sessionId,
} from "../utils";
import { useSessionsPageMutations } from "./mutation";
import { useSessionsPageQueries } from "./query";

export function useSessionsModule(): SessionsModuleController {
  const queries = useSessionsPageQueries();
  const mutations = useSessionsPageMutations({
    refreshSessions: queries.refreshSessions,
    refreshUsage: queries.refreshUsage,
  });

  return {
    sessionsEnvelope: queries.sessionsEnvelope,
    usageEnvelope: queries.usageEnvelope,
    sessionsQuery: queries.sessionsQuery,
    usageQuery: queries.usageQuery,
    ...mutations,
    refreshAction: {
      ...mutations.refreshAction,
      isPending: queries.sessionsQuery.isFetching || queries.usageQuery.isFetching,
    },
  };
}

export function useSessionsPageController(): SessionsPageController {
  const { t } = useTranslation();
  const module = useSessionsModule();
  const sessionsPayload =
    module.sessionsEnvelope?.payload ??
    (module.sessionsEnvelope ? null : module.sessionsQuery.data);
  const usagePayload =
    module.usageEnvelope?.payload ??
    (module.usageEnvelope ? null : module.usageQuery.data);
  const payload = selectSessionsEnvelopeData<SessionsListPayload | SessionsDeletePayload>(
    sessionsPayload,
  );
  const usage = selectSessionsEnvelopeData<UsageAnalyticsPayload>(usagePayload);
  const sessions = useMemo(() => selectSessionRecords(payload), [payload]);
  const groups = useMemo(() => buildSessionGroups(sessions), [sessions]);
  const orphanCount = useMemo(() => countOrphans(groups), [groups]);
  const loading =
    !sessionsPayload &&
    (module.sessionsQuery.isLoading || module.sessionsQuery.isFetching);
  const metrics = useMemo<SessionMetricItem[]>(
    () => [
      {
        key: "totalSessions",
        labelKey: "sessions.totalSessions",
        value: readNumber(usage, ["sessionStats.totalSessions"], sessions.length),
      },
      {
        key: "totalSize",
        labelKey: "sessions.totalSize",
        value: formatBytes(readNumber(usage, ["sessionStats.totalSizeBytes"])),
      },
      {
        key: "activeDays",
        labelKey: "sessions.activeDays",
        value: readNumber(usage, ["sessionStats.activeDays"]),
      },
      {
        key: "avgPerDay",
        labelKey: "sessions.avgPerDay",
        value: readNumber(usage, ["sessionStats.avgSessionsPerActiveDay"]).toFixed(1),
      },
    ],
    [sessions.length, usage],
  );
  const initialExpanded = useRef(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => new Set());
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(() => new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<SessionsDeleteRequest | null>(null);

  const allIds = useMemo(() => flattenGroups(groups), [groups]);
  const allIdSet = useMemo(() => new Set(allIds), [allIds]);

  useEffect(() => {
    if (initialExpanded.current || groups.length === 0) return;
    const firstGroup = groups[0];
    const firstRoot = firstGroup.roots[0];
    initialExpanded.current = true;
    setExpandedProjects(new Set([firstGroup.key]));
    if (firstRoot) setExpandedThreads(new Set([sessionId(firstRoot.session)]));
  }, [groups]);

  useEffect(() => {
    setSelected((current) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of current) {
        if (allIdSet.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [allIdSet]);

  useEffect(() => {
    if (allIds.length === 0) {
      if (focusedId !== null) setFocusedId(null);
      return;
    }
    if (!focusedId || !allIdSet.has(focusedId)) setFocusedId(allIds[0]);
  }, [allIds, allIdSet, focusedId]);

  const toggleProject = (key: string) => {
    setExpandedProjects((current) => toggleSetItem(current, key));
  };

  const toggleThread = (id: string) => {
    setExpandedThreads((current) => toggleSetItem(current, id));
  };

  const toggleIds = (ids: string[]) => {
    setSelected((current) => {
      const next = new Set(current);
      const shouldSelect = ids.some((id) => !next.has(id));
      for (const id of ids) {
        if (shouldSelect) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const requestSelectedDelete = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setDeleteRequest({
      ids,
      title: t("sessions.deleteSelectionTitle", { count: ids.length }),
      description: t("sessions.deleteSelectionDesc", { count: ids.length }),
      actionLabel: t("sessions.delete"),
    });
  };

  const cancelDeleteRequest = () => {
    setDeleteRequest(null);
  };

  const confirmDeleteRequest = async () => {
    if (!deleteRequest) return;
    const request = deleteRequest;
    const payload = await module.deleteSessions.run(request.ids);
    const deletedIds = selectDeletedSessionIds(payload);
    setSelected((current) => {
      const next = new Set(current);
      for (const id of deletedIds) next.delete(id);
      return next;
    });
    setFocusedId((current) => (current && deletedIds.includes(current) ? null : current));
    setDeleteRequest(null);
  };

  return {
    groups,
    metrics,
    loading,
    orphanCount,
    selected,
    selectedCount: selected.size,
    expandedProjects,
    expandedThreads,
    focusedId,
    deleteRequest,
    deletePending: module.deleteSessions.isPending,
    refreshPending: module.refreshAction.isPending,
    refresh: module.refreshAction.run,
    toggleProject,
    toggleThread,
    toggleIds,
    focusSession: setFocusedId,
    requestSelectedDelete,
    cancelDeleteRequest,
    confirmDeleteRequest,
  };
}

function toggleSetItem(current: Set<string>, value: string) {
  const next = new Set(current);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
