import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  CoreEnvelope,
  SessionRecordPayload,
  SessionsDeletePayload,
  SessionsListPayload,
  UsageAnalyticsPayload,
} from "@/types";

export type SessionsModuleId = "sessions";
export type SessionsListEnvelope = CoreEnvelope<SessionsListPayload>;
export type SessionsDeleteEnvelope = CoreEnvelope<SessionsDeletePayload>;
export type SessionsUsageEnvelope = CoreEnvelope<UsageAnalyticsPayload>;
export type SessionsMutationPayload = SessionsDeletePayload;
export type SessionsMutationEnvelope = CoreEnvelope<SessionsMutationPayload>;
export type SessionsCachePayload =
  | SessionsListEnvelope
  | SessionsMutationEnvelope
  | null;
export type SessionsCacheEnvelope<TPayload = SessionsCachePayload> =
  ModuleCacheEnvelope<TPayload>;
export type SessionsUsageCacheEnvelope =
  ModuleCacheEnvelope<SessionsUsageEnvelope | null>;
export type SessionRecord = SessionRecordPayload;

export interface SessionNode {
  session: SessionRecord;
  isOrphan: boolean;
  children: SessionNode[];
}

export interface SessionGroup {
  key: string;
  name: string;
  path: string;
  roots: SessionNode[];
  sessionCount: number;
  projectPathMissing: boolean;
}

export interface SessionMetricItem {
  key: string;
  labelKey: string;
  value: string | number;
}

/** Query owner 暴露给 page owner 的只读状态，不包含 cache 写入能力。 */
export interface SessionsQueryController<TData> {
  data: TData | undefined;
  error: unknown;
  isError: boolean;
  isFetching: boolean;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

/** sessions query owner 的边界接口，聚合 sessions 和 analytics usage 读取状态。 */
export interface SessionsPageQueries {
  sessionsEnvelope: SessionsCacheEnvelope | null | undefined;
  usageEnvelope: SessionsUsageCacheEnvelope | null | undefined;
  sessionsQuery: SessionsQueryController<SessionsListEnvelope>;
  usageQuery: SessionsQueryController<SessionsUsageEnvelope>;
  refreshSessions: () => Promise<void>;
  refreshUsage: () => Promise<void>;
}

export interface SessionsAction<TResult = void> {
  run: () => Promise<TResult>;
  isPending: boolean;
}

export interface SessionsInputAction<TInput, TResult = void> {
  run: (input: TInput) => Promise<TResult>;
  isPending: boolean;
}

/** mutation owner 的边界接口，只暴露用户动作，不暴露 queryClient/cache 细节。 */
export interface SessionsPageMutations {
  refreshAction: SessionsAction<void>;
  deleteSessions: SessionsInputAction<string[], SessionsDeleteEnvelope>;
}

/** page owner 组合 query/mutation 后给 UI 派生层消费的模块接口。 */
export interface SessionsModuleController extends SessionsPageMutations {
  sessionsEnvelope: SessionsCacheEnvelope | null | undefined;
  usageEnvelope: SessionsUsageCacheEnvelope | null | undefined;
  sessionsQuery: SessionsQueryController<SessionsListEnvelope>;
  usageQuery: SessionsQueryController<SessionsUsageEnvelope>;
}

export interface SessionsPageController {
  groups: SessionGroup[];
  metrics: SessionMetricItem[];
  loading: boolean;
  orphanCount: number;
  selected: Set<string>;
  selectedCount: number;
  expandedProjects: Set<string>;
  expandedThreads: Set<string>;
  focusedId: string | null;
  deleteRequest: SessionsDeleteRequest | null;
  deletePending: boolean;
  refreshPending: boolean;
  refresh: () => Promise<void>;
  toggleProject: (key: string) => void;
  toggleThread: (id: string) => void;
  toggleIds: (ids: string[]) => void;
  focusSession: (id: string) => void;
  requestSelectedDelete: () => void;
  cancelDeleteRequest: () => void;
  confirmDeleteRequest: () => Promise<void>;
}

export interface SessionsDeleteRequest {
  ids: string[];
  title: string;
  description: string;
  actionLabel: string;
}
